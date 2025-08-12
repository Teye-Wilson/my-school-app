import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// The API_URL for your Google Apps Script Web App
const API_URL = "https://script.google.com/macros/s/AKfycbyZqM4x67pxr_CY_G1aAX07WUBBCnzHsnmSCnDlTF9oSMcCLq6XUOu1nJN5HlSOGWql/exec";

// Auth context to manage user state globally
const AuthContext = createContext();

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

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const login = async (id, password, role) => {
    const response = await fetcher('login', { id, password, role });
    if (response.success) {
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      {children}
    </div>,
    document.body
  );
};

const Input = ({ type, placeholder, value, onChange }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
  />
);

const Select = ({ children, value, onChange, className = '', disabled }) => (
  <select
    value={value}
    onChange={onChange}
    className={`w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 ${className}`}
    disabled={disabled}
  >
    {children}
  </select>
);

const Button = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 transition-colors ${className}`}
  >
    {children}
  </button>
);

const IconButton = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${className}`}
  >
    {children}
  </button>
);

const Table = ({ headers, data, onEdit, onDelete, idKey }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow-lg mt-6">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-indigo-50">
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-6 py-3 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">{header}</th>
          ))}
          {(onEdit || onDelete) && <th className="px-6 py-3 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {data && data.length > 0 ? (
          data.map((row, index) => (
            <tr key={index} className="hover:bg-indigo-50 transition-colors">
              {headers.map((header) => (
                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{row[header]}</td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {onEdit && (
                    <IconButton onClick={() => onEdit(row)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton onClick={() => onDelete(row[idKey])} className="ml-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m0 0h8"></path></svg>
                    </IconButton>
                  )}
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">No data found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const Sidebar = ({ onTabChange, activeTab }) => {
  const { role, logout } = useContext(AuthContext);

  const adminNavItems = ['Students', 'Teachers', 'Courses', 'Classes', 'Subjects', 'Marks', 'Attendance', 'Fees'];
  const teacherNavItems = ['My Students', 'Marks', 'Attendance'];
  const studentNavItems = ['My Marks', 'My Attendance', 'My Fees', 'My Report Card'];
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return adminNavItems;
      case 'teacher':
        return teacherNavItems;
      case 'student':
        return studentNavItems;
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col h-full bg-indigo-800 text-white p-6 rounded-r-3xl shadow-2xl">
      <div className="flex-grow">
        <h2 className="text-3xl font-extrabold mb-8">Dashboard</h2>
        <nav>
          {getNavItems().map(item => (
            <button
              key={item}
              onClick={() => onTabChange(item)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center mb-2 ${activeTab === item ? 'bg-indigo-600' : 'hover:bg-indigo-700'}`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-8">
        <Button onClick={logout} className="bg-red-500 hover:bg-red-600">
          Log Out
        </Button>
      </div>
    </div>
  );
};

const Header = ({ title }) => {
  const { user } = useContext(AuthContext);
  const name = user ? user.name || 'User' : 'Guest';
  return (
    <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md mb-6">
      <h1 className="text-3xl font-bold text-indigo-900">{title}</h1>
      <span className="text-lg text-gray-700">Welcome, {name}</span>
    </header>
  );
};

const AdminDashboard = ({ activeTab }) => {
  const [data, setData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState('');

  // Dropdown data states
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const headers = {
    Students: ['student_id', 'name', 'password', 'course_id', 'class_id'],
    Teachers: ['teacher_id', 'name', 'password', 'email'],
    Courses: ['course_id', 'course_name'],
    Classes: ['class_id', 'class_name', 'course_id', 'teacher_id'],
    Subjects: ['subject_id', 'subject_name', 'teacher_id', 'class_id'],
    Marks: ['mark_id', 'student_id', 'subject_id', 'term', 'score', 'semester'],
    Attendance: ['attendance_id', 'student_id', 'class_id', 'date', 'status'],
    Fees: ['fees_id', 'student_id', 'amount', 'status', 'due_date'],
  };

  const idKeys = {
    Students: 'student_id',
    Teachers: 'teacher_id',
    Courses: 'course_id',
    Classes: 'class_id',
    Subjects: 'subject_id',
    Marks: 'mark_id',
    Attendance: 'attendance_id',
    Fees: 'fees_id',
  };

  const fetchData = useCallback(async () => {
    setMessage('Loading data...');
    const [
      studentsRes, teachersRes, coursesRes, classesRes, subjectsRes, marksRes, attendanceRes, feesRes
    ] = await Promise.all([
      fetcher('getStudents'),
      fetcher('getTeachers'),
      fetcher('getCourses'),
      fetcher('getClasses'),
      fetcher('getSubjects'),
      fetcher('getStudentMarks'),
      fetcher('getStudentAttendance'),
      fetcher('getStudentFees'),
    ]);
    setData({
      Students: studentsRes.data,
      Teachers: teachersRes.data,
      Courses: coursesRes.data,
      Classes: classesRes.data,
      Subjects: subjectsRes.data,
      Marks: marksRes.data,
      Attendance: attendanceRes.data,
      Fees: feesRes.data,
    });
    setCourses(coursesRes.data);
    setClasses(classesRes.data);
    setTeachers(teachersRes.data);
    setMessage('');
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddEdit = async (e) => {
    e.preventDefault();
    const action = isEditMode ? `update${activeTab.slice(0, -1)}` : `add${activeTab.slice(0, -1)}`;
    const response = await fetcher(action, formData);
    if (response.success) {
      setMessage(`Successfully ${isEditMode ? 'updated' : 'added'}!`);
      setShowForm(false);
      setFormData({});
      setIsEditMode(false);
      fetchData();
    } else {
      setMessage(`Error: ${response.message}`);
    }
  };

  const handleEdit = (entry) => {
    setFormData(entry);
    setIsEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const action = `delete${activeTab.slice(0, -1)}`;
      const response = await fetcher(action, { [idKeys[activeTab]]: id });
      if (response.success) {
        setMessage('Successfully deleted!');
        fetchData();
      } else {
        setMessage(`Error: ${response.message}`);
      }
    }
  };

  const renderForm = () => {
    const formTitle = isEditMode ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`;
    const isAddingClass = activeTab === 'Classes';
    const isAddingSubject = activeTab === 'Subjects';
    const isAddingStudent = activeTab === 'Students';

    return (
      <Modal>
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">{formTitle}</h2>
          <form onSubmit={handleAddEdit}>
            {isAddingClass && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Class ID</label>
                  <Input
                    type="text"
                    placeholder="class_id"
                    value={formData.class_id || ''}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Class Name</label>
                  <Input
                    type="text"
                    placeholder="class_name"
                    value={formData.class_name || ''}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Course</label>
                  <Select
                    value={formData.course_id || ''}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name} ({course.course_id})
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
            {isAddingSubject && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Subject ID</label>
                  <Input
                    type="text"
                    placeholder="subject_id"
                    value={formData.subject_id || ''}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Subject Name</label>
                  <Input
                    type="text"
                    placeholder="subject_name"
                    value={formData.subject_name || ''}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Teacher</label>
                  <Select
                    value={formData.teacher_id || ''}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.teacher_id} value={teacher.teacher_id}>
                        {teacher.name} ({teacher.teacher_id})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Class</label>
                  <Select
                    value={formData.class_id || ''}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {classes.map(classItem => (
                      <option key={classItem.class_id} value={classItem.class_id}>
                        {classItem.class_name} ({classItem.class_id})
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
            {isAddingStudent && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Student ID</label>
                  <Input
                    type="text"
                    placeholder="student_id"
                    value={formData.student_id || ''}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                  <Input
                    type="text"
                    placeholder="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                  <Input
                    type="password"
                    placeholder="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Course</label>
                  <Select
                    value={formData.course_id || ''}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.course_id} value={course.course_id}>
                        {course.course_name} ({course.course_id})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Class</label>
                  <Select
                    value={formData.class_id || ''}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {classes.map(classItem => (
                      <option key={classItem.class_id} value={classItem.class_id}>
                        {classItem.class_name} ({classItem.class_id})
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
            {/* For other tables, just use standard inputs */}
            {!(isAddingClass || isAddingSubject || isAddingStudent) && headers[activeTab].filter(h => h !== idKeys[activeTab]).map(header => (
              <div key={header} className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">{header.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</label>
                <Input
                  type="text"
                  placeholder={header.replace('_', ' ')}
                  value={formData[header] || ''}
                  onChange={(e) => setFormData({ ...formData, [header]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex justify-end space-x-4 mt-4">
              <Button onClick={() => { setShowForm(false); setFormData({}); setIsEditMode(false); }} className="bg-gray-400 hover:bg-gray-500">Cancel</Button>
              <Button onClick={handleAddEdit}>{isEditMode ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </div>
      </Modal>
    );
  };

  return (
    <div className="flex flex-col flex-grow p-8">
      <Header title="Admin Dashboard" />
      {message && <div className="text-center my-4 text-lg font-semibold text-indigo-600">{message}</div>}
      <div className="flex justify-end my-4">
        {['Students', 'Teachers', 'Courses', 'Classes', 'Subjects'].includes(activeTab) && (
          <Button onClick={() => { setShowForm(true); setIsEditMode(false); setFormData({}); }} className="w-auto px-6 py-2">
            Add New {activeTab.slice(0, -1)}
          </Button>
        )}
      </div>
      {data[activeTab] && (
        <Table
          headers={headers[activeTab]}
          data={data[activeTab]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          idKey={idKeys[activeTab]}
        />
      )}
      {showForm && renderForm()}
    </div>
  );
};


const TeacherDashboard = ({ activeTab, onTabChange }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({});
  const [message, setMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [marksToSubmit, setMarksToSubmit] = useState({});

  const headers = {
    'My Students': ['student_id', 'name', 'course_id', 'class_id'],
    'Marks': ['mark_id', 'student_id', 'subject_id', 'term', 'score', 'semester'],
    'Attendance': ['attendance_id', 'student_id', 'class_id', 'date', 'status'],
  };
  const idKeys = { 'Marks': 'mark_id', 'Attendance': 'attendance_id' };

  const fetchData = useCallback(async () => {
    setMessage('Loading data...');
    const response = await fetcher('getTeacherData', { teacher_id: user.teacher_id });
    if (response.success) {
      setData({
        'My Students': response.data.students,
        'Marks': response.data.marks,
        'Attendance': response.data.attendance,
        'Subjects': response.data.subjects,
        'Classes': response.data.classes,
      });
    }
    setMessage('');
  }, [user]);

  useEffect(() => {
    if (user && user.teacher_id) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleMarkChange = (studentId, value) => {
    setMarksToSubmit(prev => ({
      ...prev,
      [studentId]: {
        score: value,
        term: 'Term 1', // Assuming a single term for simplicity
        semester: 1, // Assuming semester 1 for simplicity
      }
    }));
  };

  const handleSubmitMarks = async () => {
    setMessage('Submitting marks...');
    const marksPayload = Object.keys(marksToSubmit).map(student_id => ({
      student_id,
      subject_id: selectedSubject,
      score: marksToSubmit[student_id].score,
      term: marksToSubmit[student_id].term,
      semester: marksToSubmit[student_id].semester,
    }));

    const response = await fetcher('addMultipleMarks', { marks: marksPayload });
    if (response.success) {
      setMessage('Marks submitted successfully!');
      setMarksToSubmit({});
      setSelectedClass('');
      setSelectedSubject('');
      fetchData();
    } else {
      setMessage(`Error: ${response.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const action = `delete${activeTab.slice(0, -1)}`;
      const response = await fetcher(action, { [idKeys[activeTab]]: id });
      if (response.success) {
        setMessage('Successfully deleted!');
        fetchData();
      } else {
        setMessage(`Error: ${response.message}`);
      }
    }
  };

  const renderEnterMarksForm = () => {
    const filteredStudents = data['My Students']?.filter(student =>
      student.class_id === selectedClass &&
      data['Subjects']?.some(subject => subject.subject_id === selectedSubject && subject.class_id === selectedClass)
    ) || [];

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
        <h3 className="text-2xl font-bold mb-4">Enter Marks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Subject</label>
            <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select Subject</option>
              {data['Subjects']?.map(subject => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name} ({subject.subject_id})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Class</label>
            <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={!selectedSubject}>
              <option value="">Select Class</option>
              {data['Classes']?.filter(cls => data['Subjects']?.some(sub => sub.class_id === cls.class_id && sub.subject_id === selectedSubject)).map(classItem => (
                <option key={classItem.class_id} value={classItem.class_id}>
                  {classItem.class_name} ({classItem.class_id})
                </option>
              ))}
            </Select>
          </div>
        </div>
        {selectedSubject && selectedClass && (
          <div className="mt-6">
            <h4 className="text-xl font-semibold mb-4">Students in {data['Classes']?.find(c => c.class_id === selectedClass)?.class_name} doing {data['Subjects']?.find(s => s.subject_id === selectedSubject)?.subject_name}</h4>
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map(student => (
                      <tr key={student.student_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Input
                            type="number"
                            placeholder="Score"
                            value={marksToSubmit[student.student_id]?.score || ''}
                            onChange={(e) => handleMarkChange(student.student_id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button onClick={handleSubmitMarks} className="mt-4">Submit Marks</Button>
              </div>
            ) : (
              <p className="text-gray-500">No students found for the selected subject and class.</p>
            )}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="flex flex-col flex-grow p-8">
      <Header title="Teacher Dashboard" />
      {message && <div className="text-center my-4 text-lg font-semibold text-indigo-600">{message}</div>}
      <div className="flex justify-center my-6 space-x-2">
        {Object.keys(headers).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={() => onTabChange('Enter Marks')}
          className={`px-4 py-2 font-semibold rounded-lg transition-colors ${activeTab === 'Enter Marks' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
        >
          Enter Marks
        </button>
      </div>

      {activeTab === 'Enter Marks' && renderEnterMarksForm()}

      {data[activeTab] && (
        <Table
          headers={headers[activeTab]}
          data={data[activeTab]}
          onDelete={idKeys[activeTab] ? handleDelete : null}
          idKey={idKeys[activeTab]}
        />
      )}
    </div>
  );
};

const StudentDashboard = ({ activeTab, onTabChange }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({});
  const [message, setMessage] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const headers = {
    'My Marks': ['mark_id', 'subject_id', 'term', 'score', 'semester'],
    'My Attendance': ['attendance_id', 'date', 'status'],
    'My Fees': ['fees_id', 'amount', 'status', 'due_date'],
  };

  const fetchData = useCallback(async () => {
    setMessage('Loading data...');
    const [marksRes, attendanceRes, feesRes] = await Promise.all([
      fetcher('getStudentMarks', { student_id: user.student_id }),
      fetcher('getStudentAttendance', { student_id: user.student_id }),
      fetcher('getStudentFees', { student_id: user.student_id }),
    ]);
    setData({
      'My Marks': marksRes.data,
      'My Attendance': attendanceRes.data,
      'My Fees': feesRes.data,
    });
    setMessage('');
  }, [user]);

  const generatePdf = async () => {
    setMessage('Generating report card...');
    const res = await fetcher('getReportCardData', { student_id: user.student_id });
    if (res.success) {
      const doc = new jsPDF('p', 'mm', 'a4');
      const student = res.data.student;
      const marks = res.data.marks;

      doc.setFontSize(20);
      doc.text("HO TECHNICAL INSTITUTE", 105, 20, null, null, "center");
      doc.setFontSize(14);
      doc.text("TERMINAL REPORT FOR ELECTRICAL ENGINEERING DEPARTMENT", 105, 30, null, null, "center");

      doc.setFontSize(12);
      doc.text(`Name of Student: ${student.name}`, 20, 50);
      doc.text(`Student ID: ${student.student_id}`, 20, 57);
      doc.text(`Course: ${student.course_id}`, 20, 64);
      doc.text(`Class: ${student.class_id}`, 20, 71);

      const tableColumn = ["SUBJECT", "CLASS SCORE (30%)", "EXAM SCORE (70%)", "TOTAL (100%)", "GRADE", "REMARKS", "SEMESTER"];
      const tableRows = marks.map(m => [m.subject_id, '', '', m.score, m.grade, m.remarks, m.semester]);

      doc.autoTable({
        startY: 80,
        head: [tableColumn],
        body: tableRows,
      });

      doc.save(`ReportCard_${student.student_id}.pdf`);
      setMessage('Report card generated successfully!');
    } else {
      setMessage(`Error generating report card: ${res.message}`);
    }
  };

  useEffect(() => {
    if (user && user.student_id) {
      fetchData();
    }
  }, [user, fetchData]);

  const filteredMarks = selectedSemester
    ? data['My Marks'].filter(mark => String(mark.semester) === selectedSemester)
    : data['My Marks'];

  const renderContent = () => {
    switch (activeTab) {
      case 'My Marks':
        return (
          <>
            <div className="flex justify-end my-4">
              <div className="w-48">
                <Select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </Select>
              </div>
            </div>
            <Table headers={headers['My Marks']} data={filteredMarks} />
          </>
        );
      case 'My Attendance':
        return <Table headers={headers['My Attendance']} data={data['My Attendance']} />;
      case 'My Fees':
        return <Table headers={headers['My Fees']} data={data['My Fees']} />;
      case 'My Report Card':
        return (
          <div className="bg-white p-6 rounded-xl shadow-lg mt-6 text-center">
            <h2 className="text-xl font-bold mb-4">Generate Report Card</h2>
            <Button onClick={generatePdf} className="w-auto px-6 py-2">
              Print Report Card
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-grow p-8">
      <Header title="Student Dashboard" />
      {message && <div className="text-center my-4 text-lg font-semibold text-indigo-600">{message}</div>}
      <div className="flex justify-center my-6 space-x-2">
        {['My Marks', 'My Attendance', 'My Fees', 'My Report Card'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-indigo-600 text-white">
      <h1 className="text-5xl font-extrabold mb-10">School Management System</h1>
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

const Card = ({ title, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 w-full max-w-xs transform hover:scale-105"
  >
    <h2 className="text-2xl font-bold text-indigo-900">{title}</h2>
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

const MainApp = () => {
  const { role } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Students');

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'teacher':
        return <TeacherDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'student':
        return <StudentDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {role && <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />}
      <div className={`flex-grow ${role ? 'p-8' : ''}`}>
        {renderDashboard()}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
