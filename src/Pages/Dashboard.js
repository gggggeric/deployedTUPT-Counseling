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

  // Helper function to safely extract ID from MongoDB ObjectId
  const extractId = (idObj) => {
    if (!idObj) return null;
    
    // If it's already a string, return it
    if (typeof idObj === 'string') return idObj;
    
    // If it has a $oid property (MongoDB extended JSON format)
    if (idObj.$oid) return idObj.$oid;
    
    // If it's an ObjectId-like object with toString method
    if (idObj.toString && typeof idObj.toString === 'function') {
      return idObj.toString();
    }
    
    // Last resort: try JSON stringify/parse
    try {
      const str = JSON.stringify(idObj);
      const parsed = JSON.parse(str);
      if (parsed.$oid) return parsed.$oid;
    } catch (e) {
      console.error('Error extracting ID:', e);
    }
    
    return String(idObj);
  };

  // Helper function to format appointment date nicely
  const formatAppointmentDate = (dateString) => {
    if (!dateString) return 'Invalid date';
    
    try {
      const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      console.error('Error formatting appointment date:', error);
      return dateString; // Return original string if formatting fails
    }
  };

  const loadUserAppointments = async (userId) => {
    try {
      const response = await fetch(`https://tupt-counselingbackend.onrender.com/appointments/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw appointments data:', data.appointments);
        
        // Ensure all appointment IDs are properly extracted as strings
        const appointmentsWithStringIds = data.appointments.map(apt => ({
          ...apt,
          _id: extractId(apt._id) // Use our safe extraction function
        }));
        
        console.log('Processed appointments:', appointmentsWithStringIds);
        setScheduledAppointments(appointmentsWithStringIds);
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
      
      const response = await fetch('https://tupt-counselingbackend.onrender.com/appointments', {
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

  // Function to mark appointment as attended
  const markAppointmentAttended = async (appointmentId, attended = true) => {
    try {
      console.log('Raw appointment ID:', appointmentId);
      console.log('Type of appointment ID:', typeof appointmentId);
      
      // Use our safe extraction function
      const stringAppointmentId = extractId(appointmentId);
      console.log('Extracted appointment ID:', stringAppointmentId);
      
      const response = await fetch(`https://tupt-counselingbackend.onrender.com/appointments/${stringAppointmentId}/attended`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attended: attended })
      });

      const result = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', result);
      
      if (response.ok) {
        alert(result.message);
        // Refresh the appointments list
        const user = JSON.parse(localStorage.getItem('currentUser'));
        loadUserAppointments(user.user_id);
      } else {
        alert(`Error: ${result.error || result.message}`);
        console.error('Backend error:', result);
      }
    } catch (error) {
      console.error('Error marking appointment:', error);
      alert('Failed to update attendance status');
    }
  };

  // Check if appointment can be marked as attended - NOW ALLOWS ANY STATUS FOR TODAY'S APPOINTMENTS
  const canMarkAttendance = (appointment) => {
    try {
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];
      const appointmentDateStr = appointment.date;
      
      // Show button if appointment date is today, regardless of approval status
      const isToday = appointmentDateStr === todayDateStr;
      
      console.log(`Can mark attendance: ${appointmentDateStr} === ${todayDateStr} = ${isToday}`);
      
      return isToday;
    } catch (error) {
      console.error('Error in canMarkAttendance:', error);
      return false;
    }
  };

  // Check if appointment is today
  const isAppointmentToday = (appointment) => {
    try {
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];
      const appointmentDateStr = appointment.date;
      
      const isToday = appointmentDateStr === todayDateStr;
      console.log(`Is today check: ${appointmentDateStr} === ${todayDateStr} = ${isToday}`);
      
      return isToday;
    } catch (error) {
      console.error('Error in isAppointmentToday:', error);
      return false;
    }
  };

  // Check if appointment is in the future
  const isAppointmentFuture = (appointment) => {
    try {
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];
      const appointmentDateStr = appointment.date;
      
      const isFuture = appointmentDateStr > todayDateStr;
      console.log(`Is future check: ${appointmentDateStr} > ${todayDateStr} = ${isFuture}`);
      
      return isFuture;
    } catch (error) {
      console.error('Error in isAppointmentFuture:', error);
      return false;
    }
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
                    {scheduledAppointments.map(appointment => {
                      const canMark = canMarkAttendance(appointment);
                      const isToday = isAppointmentToday(appointment);
                      const isFuture = isAppointmentFuture(appointment);
                      const isPast = !isToday && !isFuture;
                      
                      return (
                        <div key={appointment._id} className="appointment-item">
                          <div className="appointment-header">
                            <span className="appointment-date">
                              {formatAppointmentDate(appointment.date)}
                            </span>
                            <span className="appointment-time">{appointment.preferred_time}</span>
                            {isToday && <span className="appointment-badge today">Today</span>}
                            {isFuture && <span className="appointment-badge future">Upcoming</span>}
                            {isPast && <span className="appointment-badge past">Past</span>}
                          </div>
                          <div className="appointment-details">
                            <span className="appointment-concern">{appointment.concern_type}</span>
                            <span className={`appointment-status ${appointment.status.toLowerCase()}`}>
                              {appointment.status}
                            </span>
                          </div>
                          <div className="appointment-meta">
                            {appointment.attended !== undefined && (
                              <small className={`attendance-status ${appointment.attended ? 'attended' : 'not-attended'}`}>
                                {appointment.attended ? '✓ Attended' : '✗ Not Attended'}
                              </small>
                            )}
                          </div>
                          
                          {/* Attendance Controls */}
                          {canMark && !appointment.attended && (
                            <div className="attendance-controls">
                              <button 
                                onClick={() => markAppointmentAttended(appointment._id, true)}
                                className="btn-mark-attended"
                              >
                                Mark as Attended
                              </button>
                            </div>
                          )}
                          
                          {canMark && appointment.attended && (
                            <div className="attendance-controls">
                              <button 
                                onClick={() => markAppointmentAttended(appointment._id, false)}
                                className="btn-mark-not-attended"
                              >
                                Mark as Not Attended
                              </button>
                            </div>
                          )}
                          
                          {/* Status Messages */}
                          {isFuture && appointment.status === 'Pending' && (
                            <div className="attendance-note">
                              <small>⏳ Waiting for approval</small>
                            </div>
                          )}
                          
                          {isFuture && (appointment.status === 'Approved' || appointment.status === 'Completed') && (
                            <div className="attendance-note">
                              <small>📅 Approved - Appointment is in the future</small>
                            </div>
                          )}
                          
                          {isToday && appointment.status === 'Pending' && (
                            <div className="attendance-note">
                              <small>⏳ Waiting for approval</small>
                            </div>
                          )}
                          
                          {isPast && appointment.status === 'Pending' && (
                            <div className="attendance-note">
                              <small>⏳ Waiting for approval - Appointment date has passed</small>
                            </div>
                          )}
                          
                          {isPast && (appointment.status === 'Approved' || appointment.status === 'Completed') && !canMark && (
                            <div className="attendance-note">
                              <small>✅ Past appointment - Attendance can be marked</small>
                            </div>
                          )}
                        </div>
                      );
                    })}
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