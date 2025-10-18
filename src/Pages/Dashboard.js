import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    concern: ''
  });
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated via localStorage
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const user = localStorage.getItem('currentUser');

    if (isAuthenticated && user) {
      const userObj = JSON.parse(user);
      setUserData(userObj);
      loadUserAppointments(userObj.user_id);
      setIsLoading(false);
    } else {
      // Redirect to login if not authenticated
      navigate('/');
    }
  }, [navigate]);

  // Helper function to format dates safely
  const formatDateSafely = (dateString) => {
    if (!dateString) {
      // Return current time if no date string provided
      const now = new Date();
      return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // If it's already a formatted string from the backend, use it directly
    if (typeof dateString === 'string' && (dateString.includes('at') || dateString.includes('AM') || dateString.includes('PM'))) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Return current time if date is invalid
        const now = new Date();
        return now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      // Return current time if there's an error
      const now = new Date();
      return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const loadUserAppointments = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/appointments/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Appointments loaded:', data.appointments);
        setScheduledAppointments(data.appointments || []);
      } else {
        console.error('Error loading appointments:', response.status);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    
    if (!appointmentData.date || !appointmentData.time || !appointmentData.concern) {
      alert('Please fill all appointment fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      const userId = user.user_id;
      
      const response = await fetch('http://localhost:5000/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          date: appointmentData.date,
          preferred_time: appointmentData.time,
          concern_type: appointmentData.concern
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh appointments list from backend
        await loadUserAppointments(userId);
        
        // Reset form
        setAppointmentData({
          date: '',
          time: '',
          concern: ''
        });

        alert('Appointment scheduled successfully!');
      } else {
        alert(data.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Appointment scheduling error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAppointment = () => {
    setAppointmentData({
      date: '',
      time: '',
      concern: ''
    });
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const today = new Date().toISOString().split('T')[0];

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasAppointment = scheduledAppointments.some(apt => apt.date === dateStr);
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${hasAppointment ? 'has-appointment' : ''}`}
        >
          {day}
          {hasAppointment && <div className="appointment-dot"></div>}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <section className="dashboard-section">
          <div className="dashboard-box">
            <h2 className="dashboard-title">Loading...</h2>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="dashboard-section">
        <div className="dashboard-layout">
          {/* Left Column - Calendar & Student Info */}
          <div className="column">
            <div className="dashboard-box equal-box">
              <h2 className="dashboard-title">TUPT Counseling Scheduler</h2>
              <div className="dashboard-subtitle">Welcome, {userData?.username}!</div>
              
              {/* Calendar */}
              <div className="calendar-container">
                <div className="calendar-header">
                  <button 
                    className="calendar-nav-btn" 
                    onClick={() => navigateMonth(-1)}
                  >
                    ‹
                  </button>
                  <h3 className="calendar-month">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button 
                    className="calendar-nav-btn" 
                    onClick={() => navigateMonth(1)}
                  >
                    ›
                  </button>
                </div>
                
                <div className="calendar-weekdays">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                
                <div className="calendar-days">
                  {generateCalendarDays()}
                </div>
                
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="appointment-dot"></div>
                    <span>Scheduled Appointment</span>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="user-info-section">
                <h3>Student Information</h3>
                <p><strong>Username:</strong> {userData?.username}</p>
                <p><strong>ID Number:</strong> {userData?.id_number}</p>
                <p><strong>Birthdate:</strong> {userData?.birthdate}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Appointment Features */}
          <div className="column">
            <div className="dashboard-box equal-box">
              {/* Schedule Appointment Section */}
              <div className="schedule-section">
                <h3 className="section-title">Schedule New Appointment</h3>
                
                <form onSubmit={handleScheduleAppointment}>
                  <div>
                    <label htmlFor="date">Appointment Date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={appointmentData.date}
                      onChange={handleAppointmentChange}
                      min={today}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="time">Preferred Time</label>
                    <select
                      id="time"
                      name="time"
                      value={appointmentData.time}
                      onChange={handleAppointmentChange}
                      required
                    >
                      <option value="">Select a time</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="concern">Concern Type</label>
                    <select
                      id="concern"
                      name="concern"
                      value={appointmentData.concern}
                      onChange={handleAppointmentChange}
                      required
                    >
                      <option value="">Select concern type</option>
                      <option value="Academic">Academic Concerns</option>
                      <option value="Personal">Personal Issues</option>
                      <option value="Career">Career Guidance</option>
                      <option value="Mental Health">Mental Health</option>
                      <option value="Relationship">Relationship Issues</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="buttons">
                    <button 
                      type="button" 
                      className="btn-clear" 
                      onClick={handleClearAppointment}
                      disabled={isSubmitting}
                    >
                      Clear
                    </button>
                    <button 
                      type="submit" 
                      className="btn-login"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Appointment History Section */}
              <div className="history-section">
                <h3 className="section-title">Appointment History</h3>
                
                {scheduledAppointments.length > 0 ? (
                  <div className="appointments-list">
                    {scheduledAppointments.map(appointment => (
                      <div key={appointment._id} className="appointment-item">
                        <div className="appointment-header">
                          <span className="appointment-date">{appointment.date}</span>
                          <span className="appointment-time">{appointment.preferred_time}</span>
                        </div>
                        <div className="appointment-details">
                          <span className="appointment-concern">{appointment.concern_type}</span>
                          <span className={`appointment-status ${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="appointment-meta">
                          <small>Scheduled on: {appointment.formatted_created_at || formatDateSafely(appointment.created_at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-appointments">
                    <p>No appointments scheduled yet.</p>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <div className="buttons" style={{ marginTop: '20px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn-clear" 
                  onClick={handleLogout}
                  style={{ width: '100%' }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;