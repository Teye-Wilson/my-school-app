import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';

// The API_URL for your Google Apps Script Web App
// This is the latest URL you provided.
const API_URL = "https://script.google.com/macros/s/AKfycbyTcViZ8D1YxXZzThlpVcD6Heku2Tutx9yPjHdln8FN52nArC8_9CfFXh-tb_20scgq/exec";

// The corrected fetcher function that sends the request in the correct format.
// It now uses "action" and "payload" to match your Apps Script.
async function fetcher(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching data for action ${action}:`, error);
    return { success: false, message: error.message };
  }
}

// Auth context to manage user state globally
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const login = async (id, password, role) => {
    const response = await fetcher('login', { id, password, role });
    if (response.success) {
      // Your Apps Script returns a user object. We should use it.
      setUser(response.user);
      setRole(role);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const Modal = ({ children }) => {
  return createPortal(
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      {children}
    </div>,
    document.body
  );
};

const Card = ({ title, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 w-full max-w-xs transform hover:scale-105"
  >
    <h2 className="text-2xl font-bold text-indigo-900">{title}</h2>
  </button>
);

const Input = ({ type, placeholder, value, onChange }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
  />
);

const Button = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-2 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transition-colors"
  >
    {children}
  </button>
);

const LoginForm = ({ role, onClose }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(id, password, role);
    if (!success) {
      setError('Invalid ID or password.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-indigo-900 mb-6 capitalize">{role} Login</h2>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder={`${role} ID`}
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 mt-2 text-sm text-center">{error}</p>}
        <Button onClick={handleSubmit}>Log In</Button>
      </form>
      <button onClick={onClose} className="w-full text-center mt-4 text-sm text-indigo-600 hover:text-indigo-800">
        Close
      </button>
    </div>
  );
};

const DashboardHeader = ({ title }) => {
  const { user, logout } = useContext(AuthContext);
  return (
    <header className="bg-white shadow-md p-6 flex justify-between items-center rounded-b-xl">
      <h1 className="text-4xl font-extrabold text-indigo-900">{title}</h1>
      <div className="flex items-center space-x-4">
        <span className="text-lg font-semibold text-indigo-800">Welcome, {user.name}</span>
        <Button onClick={logout} className="w-auto px-6 py-2">Log Out</Button>
      </div>
    </header>
  );
};

const Table = ({ headers, data }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow-lg mt-6">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-indigo-50">
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-6 py-3 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data && data.length > 0 ? (
          data.map((row, index) => (
            <tr key={index} className="hover:bg-indigo-50 transition-colors">
              {headers.map((header) => (
                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row[header]}</td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length} className="px-6 py-4 text-center text-sm text-gray-500">No data found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState('Students');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({});
  const [message, setMessage] = useState('');

  const headers = {
    Admins: ['admin_id', 'password', 'name'],
    Teachers: ['teacher_id', 'password', 'name', 'email'],
    Students: ['student_id', 'password', 'name', 'class', 'parent_name', 'phone'],
    Classes: ['class_id', 'class_name', 'teacher_id', 'subject_ids'],
    Subjects: ['subject_id', 'subject_name'],
    Marks: ['mark_id', 'student_id', 'subject_id', 'term', 'score'],
    Attendance: ['attendance_id', 'student_id', 'class_id', 'date', 'status'],
    Fees: ['fees_id', 'student_id', 'amount', 'status', 'due_date'],
  };

  const fetchData = useCallback(async () => {
    setMessage('Loading data...');
    const [admins, teachers, students, classes, subjects, marks, attendance, fees] = await Promise.all([
      fetcher('getAdmins'),
      fetcher('getTeachers'),
      fetcher('getStudents'),
      fetcher('getClasses'),
      fetcher('getSubjects'),
      fetcher('getStudentMarks'),
      fetcher('getStudentAttendance'),
      fetcher('getStudentFees'),
    ]);
    setData({
      Admins: admins.data,
      Teachers: teachers.data,
      Students: students.data,
      Classes: classes.data,
      Subjects: subjects.data,
      Marks: marks.data,
      Attendance: attendance.data,
      Fees: fees.data,
    });
    setMessage('');
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setMessage('Adding new entry...');
    let action;
    switch (activeTab) {
      case 'Teachers':
        action = 'addTeacher';
        break;
      case 'Students':
        action = 'addStudent';
        break;
      case 'Classes':
        action = 'addClass';
        break;
      case 'Subjects':
        action = 'addSubject';
        break;
      default:
        setMessage('Cannot add data for this tab.');
        return;
    }
    const response = await fetcher(action, newEntry);
    if (response.success) {
      setMessage(`Successfully added new ${activeTab.toLowerCase()}!`);
      setNewEntry({});
      setShowAddForm(false);
      fetchData(); // Refresh data
    } else {
      setMessage(`Error: ${response.message}`);
    }
  };

  const renderAddForm = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
        <h3 className="text-xl font-bold mb-4">Add New {activeTab.slice(0, -1)}</h3>
        <form onSubmit={handleAddSubmit} className="grid grid-cols-2 gap-4">
          {headers[activeTab].map(header => (
            <Input
              key={header}
              type="text"
              placeholder={header.charAt(0).toUpperCase() + header.slice(1).replace('_', ' ')}
              value={newEntry[header] || ''}
              onChange={(e) => setNewEntry({ ...newEntry, [header]: e.target.value })}
            />
          ))}
          <div className="col-span-2 flex space-x-4">
            <Button onClick={handleAddSubmit}>Add</Button>
            <Button onClick={() => setShowAddForm(false)} className="bg-gray-400 hover:bg-gray-500">Cancel</Button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <DashboardHeader title="Admin Dashboard" />
      <div className="flex justify-center my-6 space-x-2">
        {Object.keys(headers).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowAddForm(false);
              setNewEntry({});
              setMessage('');
            }}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {message && <div className="text-center my-4 text-lg font-semibold text-indigo-600">{message}</div>}
      <div className="flex justify-end my-4">
        {['Teachers', 'Students', 'Classes', 'Subjects'].includes(activeTab) && (
          <Button onClick={() => setShowAddForm(!showAddForm)} className="w-auto px-6 py-2">
            {showAddForm ? 'Hide Form' : `Add New ${activeTab.slice(0, -1)}`}
          </Button>
        )}
      </div>
      {showAddForm && renderAddForm()}
      {data[activeTab] && (
        <Table
          headers={headers[activeTab]}
          data={data[activeTab]}
        />
      )}
    </div>
  );
};



const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState('Students');
  const [newMark, setNewMark] = useState({ student_id: '', subject_id: '', term: '', score: '' });

  const fetchStudents = useCallback(async () => {
    const response = await fetcher('getStudents', { teacher_id: user.teacher_id });
    if (response.success) {
      setStudents(response.data);
    }
  }, [user]);

  const fetchMarks = useCallback(async () => {
    const response = await fetcher('getTeacherMarks', { teacher_id: user.teacher_id });
    if (response.success) {
      setMarks(response.data);
    }
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    const response = await fetcher('getTeacherAttendance', { teacher_id: user.teacher_id });
    if (response.success) {
      setAttendance(response.data);
    }
  }, [user]);

  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    await fetcher('addMark', { ...newMark });
    setNewMark({ student_id: '', subject_id: '', term: '', score: '' });
    fetchMarks();
  };

  useEffect(() => {
    fetchStudents();
    fetchMarks();
    fetchAttendance();
  }, [user, fetchStudents, fetchMarks, fetchAttendance]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Students':
        return <Table headers={['student_id', 'name', 'class']} data={students} />;
      case 'Marks':
        return (
          <>
            <Table headers={['mark_id', 'student_id', 'subject_id', 'term', 'score']} data={marks} />
            <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
              <h3 className="text-xl font-bold mb-4">Add New Mark</h3>
              <form onSubmit={handleMarkSubmit} className="grid grid-cols-2 gap-4">
                <Input type="text" placeholder="Student ID" value={newMark.student_id} onChange={(e) => setNewMark({ ...newMark, student_id: e.target.value })} />
                <Input type="text" placeholder="Subject ID" value={newMark.subject_id} onChange={(e) => setNewMark({ ...newMark, subject_id: e.target.value })} />
                <Input type="text" placeholder="Term" value={newMark.term} onChange={(e) => setNewMark({ ...newMark, term: e.target.value })} />
                <Input type="number" placeholder="Score" value={newMark.score} onChange={(e) => setNewMark({ ...newMark, score: e.target.value })} />
                <Button onClick={handleMarkSubmit}>Add Mark</Button>
              </form>
            </div>
          </>
        );
      case 'Attendance':
        return <Table headers={['attendance_id', 'student_id', 'class_id', 'date', 'status']} data={attendance} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <DashboardHeader title="Teacher Dashboard" />
      <div className="flex justify-center my-6 space-x-2">
        {['Students', 'Marks', 'Attendance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [activeTab, setActiveTab] = useState('Marks');

  const fetchMarks = useCallback(async () => {
    const response = await fetcher('getStudentMarks', { student_id: user.student_id });
    if (response.success) {
      setMarks(response.data);
    }
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    const response = await fetcher('getStudentAttendance', { student_id: user.student_id });
    if (response.success) {
      setAttendance(response.data);
    }
  }, [user]);

  const fetchFees = useCallback(async () => {
    const response = await fetcher('getStudentFees', { student_id: user.student_id });
    if (response.success) {
      setFees(response.data);
    }
  }, [user]);

  useEffect(() => {
    fetchMarks();
    fetchAttendance();
    fetchFees();
  }, [user, fetchMarks, fetchAttendance, fetchFees]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Marks':
        return <Table headers={['mark_id', 'subject_id', 'term', 'score']} data={marks} />;
      case 'Attendance':
        return <Table headers={['attendance_id', 'date', 'status']} data={attendance} />;
      case 'Fees':
        return <Table headers={['fees_id', 'amount', 'status', 'due_date']} data={fees} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <DashboardHeader title="Student Dashboard" />
      <div className="flex justify-center my-6 space-x-2">
        {['Marks', 'Attendance', 'Fees'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

const HomePage = () => {
  const [loginRole, setLoginRole] = useState(null);

  const handleCardClick = (role) => {
    setLoginRole(role);
  };

  const handleCloseModal = () => {
    setLoginRole(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-extrabold text-white mb-10">School Management System</h1>
      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        <Card title="Admin" onClick={() => handleCardClick('admin')} />
        <Card title="Teacher" onClick={() => handleCardClick('teacher')} />
        <Card title="Student" onClick={() => handleCardClick('student')} />
      </div>
      {loginRole && (
        <Modal>
          <LoginForm role={loginRole} onClose={handleCloseModal} />
        </Modal>
      )}
    </div>
  );
};

// New child component to handle the rendering logic
const AppContent = () => {
  const { role } = useContext(AuthContext);

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <HomePage />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
