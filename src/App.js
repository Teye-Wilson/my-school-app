import React, { useState, useEffect, createContext, useContext } from 'react';

// You MUST replace this with your deployed Google Apps Script URL
const API_URL = "https://script.google.com/macros/s/AKfycbwt6HJ87eFTv-UdhvsOqkUBsh72Sy4lR5xAMUDMX06gUfeWLNRyN7657EXzyfXqrHgV/exec";

const AppContext = createContext(null);

const fetcher = async (action, payload) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Failed to connect to the backend.' };
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const login = async (role, id, password) => {
    const response = await fetcher('login', { role, id, password });
    if (response.success) {
      setUser(response.user);
      setRole(role);
    }
    return response;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  const value = { user, role, login, logout, fetcher };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const Card = ({ title, description, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`p-8 rounded-2xl shadow-xl flex flex-col items-center text-center transition-transform transform hover:scale-105 duration-300
      ${color === 'purple' ? 'bg-indigo-900 text-white' : 'bg-white text-gray-800'}
      `}
  >
    <div className={`p-4 rounded-full mb-4 ${color === 'purple' ? 'bg-indigo-700' : 'bg-gray-200'}`}>
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
    </div>
    <h3 className="text-2xl font-bold mb-2">{title}</h3>
    <p className="text-sm opacity-80">{description}</p>
  </button>
);

const Input = ({ label, type = 'text', value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    />
  </div>
);

const Button = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition duration-200 ${className}`}
  >
    {children}
  </button>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full relative">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {children}
    </div>
  </div>
);

const DashboardCard = ({ title, value, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-md transition-shadow hover:shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold text-gray-700">{title}</h3>
      {children}
    </div>
    <p className="text-4xl font-extrabold text-indigo-600">{value}</p>
  </div>
);

const Table = ({ data, columns }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const LoginForm = ({ role, onLoginSuccess }) => {
  const { login } = useContext(AppContext);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const response = await login(role, id, password);
    setLoading(false);
    if (!response.success) {
      setError(response.message);
    } else {
      onLoginSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="text-2xl font-bold mb-4 capitalize">{role} Login</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <Input
        label={`${role.toUpperCase()} ID`}
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

const HomePage = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-indigo-900 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <Card
          title="Admin"
          description="Login as an administrator to access the dashboard to manage app data."
          icon={<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />}
          onClick={() => onLoginClick('admin')}
          color="purple"
        />
        <Card
          title="Student"
          description="Login as a student to explore course materials and assignments."
          icon={<path d="M12 3L1 9l11 6 11-6-11-6zm0 14.5l-9-4.75V19h18v-6.25l-9 4.75z" />}
          onClick={() => onLoginClick('student')}
        />
        <Card
          title="Teacher"
          description="Login as a teacher to create courses, assignments, and track student progress."
          icon={<path d="M12 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />}
          onClick={() => onLoginClick('teacher')}
        />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout, fetcher } = useContext(AppContext);
  const [view, setView] = useState('students');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    let action = '';
    let payload = {};
    switch (view) {
      case 'students': action = 'getStudents'; break;
      case 'teachers': action = 'getTeachers'; break;
      case 'classes': action = 'getClasses'; break;
      case 'subjects': action = 'getSubjects'; break;
    }

    const response = await fetcher(action, payload);
    if (response.success) {
      setData(response.data);
    } else {
      console.error(response.message);
    }
    setLoading(false);
  };

  const columns = {
    students: [
      { key: 'student_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'class', label: 'Class' },
      { key: 'parent_name', label: 'Parent Name' },
      { key: 'phone', label: 'Phone' },
    ],
    teachers: [
      { key: 'teacher_id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ],
    classes: [
      { key: 'class_id', label: 'ID' },
      { key: 'class_name', label: 'Class Name' },
      { key: 'teacher_id', label: 'Teacher ID' },
    ],
    subjects: [
      { key: 'subject_id', label: 'ID' },
      { key: 'subject_name', label: 'Subject Name' },
    ],
  };

  const menuItems = [
    { key: 'students', label: 'Students' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'classes', label: 'Classes' },
    { key: 'subjects', label: 'Subjects' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white p-6 shadow-2xl rounded-tr-3xl rounded-br-3xl">
        <h1 className="text-3xl font-bold mb-8">Admin Portal</h1>
        <nav>
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`block w-full text-left py-3 px-4 rounded-lg mb-2 transition-colors duration-200
                ${view === item.key ? 'bg-indigo-700 font-semibold' : 'hover:bg-indigo-800'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-8 w-full py-2 px-4 bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition duration-200"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-extrabold capitalize">{view} Management</h2>
          <p className="text-lg">Welcome, {user.name}!</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <Table data={data} columns={columns[view]} />
        )}
      </main>
    </div>
  );
};

const TeacherDashboard = () => {
  const { user, logout, fetcher } = useContext(AppContext);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const response = await fetcher('getStudents');
    if (response.success) {
      setStudents(response.data.filter(s => s.class === 'Class A')); // Filter by teacher's class
    }
    setLoading(false);
  };

  const fetchStudentData = async (student_id) => {
    setLoading(true);
    const [marksResponse, attendanceResponse] = await Promise.all([
      fetcher('getStudentMarks', { student_id }),
      fetcher('getStudentAttendance', { student_id, class_id: 'class_a' })
    ]);
    if (marksResponse.success) setMarks(marksResponse.data);
    if (attendanceResponse.success) setAttendance(attendanceResponse.data);
    setLoading(false);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    fetchStudentData(student.student_id);
  };

  const handleAddMark = async (e) => {
    e.preventDefault();
    const newMark = {
      student_id: selectedStudent.student_id,
      subject_id: e.target.subject.value,
      term: e.target.term.value,
      score: e.target.score.value,
    };
    await fetcher('addMark', newMark);
    fetchStudentData(selectedStudent.student_id);
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    const newAttendance = {
      student_id: selectedStudent.student_id,
      class_id: 'class_a', // Example
      date: new Date().toLocaleDateString(),
      status: e.target.status.value,
    };
    await fetcher('addAttendance', newAttendance);
    fetchStudentData(selectedStudent.student_id);
  };

  const marksColumns = [
    { key: 'subject_id', label: 'Subject' },
    { key: 'term', label: 'Term' },
    { key: 'score', label: 'Score' },
  ];

  const attendanceColumns = [
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 p-10">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold">Teacher Portal</h1>
        <p className="text-lg">Welcome, {user.name}!</p>
        <button
          onClick={logout}
          className="py-2 px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-md col-span-1">
          <h2 className="text-2xl font-bold mb-4">My Students</h2>
          <ul className="space-y-2">
            {students.map(student => (
              <li
                key={student.student_id}
                onClick={() => handleSelectStudent(student)}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200
                  ${selectedStudent?.student_id === student.student_id ? 'bg-indigo-100 font-semibold' : 'hover:bg-gray-50'}`}
              >
                {student.name}
              </li>
            ))}
          </ul>
        </div>

        {selectedStudent && (
          <div className="bg-white p-6 rounded-2xl shadow-md col-span-2">
            <h2 className="text-2xl font-bold mb-4">Actions for {selectedStudent.name}</h2>

            {/* Add Mark Form */}
            <h3 className="text-xl font-semibold mb-2">Add Mark</h3>
            <form onSubmit={handleAddMark} className="mb-6 flex space-x-4">
              <Input label="Subject" name="subject" />
              <Input label="Term" name="term" />
              <Input label="Score" name="score" type="number" />
              <Button type="submit" className="w-auto self-end">Add Mark</Button>
            </form>
            <Table data={marks} columns={marksColumns} />

            {/* Add Attendance Form */}
            <h3 className="text-xl font-semibold mb-2 mt-6">Add Attendance</h3>
            <form onSubmit={handleAddAttendance} className="flex space-x-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <Button type="submit" className="w-auto self-end">Mark Attendance</Button>
            </form>
            <Table data={attendance} columns={attendanceColumns} />
          </div>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user, logout, fetcher } = useContext(AppContext);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    setLoading(true);
    const response = await fetcher('getStudentMarks', { student_id: user.student_id });
    if (response.success) {
      setMarks(response.data);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const marksColumns = [
    { key: 'subject_id', label: 'Subject' },
    { key: 'term', label: 'Term' },
    { key: 'score', label: 'Score' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 p-10">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold">Student Portal</h1>
        <div className="flex space-x-4">
          <p className="text-lg">Welcome, {user.name}!</p>
          <button
            onClick={logout}
            className="py-2 px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Results</h2>
          <Button onClick={handlePrint} className="w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zM9 13v6" />
            </svg>
            Print
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <Table data={marks} columns={marksColumns} />
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [loginRole, setLoginRole] = useState(null);
  const { role } = useContext(AppContext);

  let content;
  if (role === 'admin') {
    content = <AdminDashboard />;
  } else if (role === 'teacher') {
    content = <TeacherDashboard />;
  } else if (role === 'student') {
    content = <StudentDashboard />;
  } else if (loginRole) {
    content = (
      <div className="min-h-screen flex items-center justify-center p-8 bg-indigo-900 font-sans">
        <Modal title={`${loginRole} Login`} onClose={() => setLoginRole(null)}>
          <LoginForm role={loginRole} onLoginSuccess={() => setLoginRole(null)} />
        </Modal>
      </div>
    );
  } else {
    content = <HomePage onLoginClick={setLoginRole} />;
  }

  return (
    <div className="font-sans antialiased text-gray-800">
      {content}
    </div>
  );
};

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
