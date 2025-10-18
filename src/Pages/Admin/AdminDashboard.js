import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('all');
  const navigate = useNavigate();

  const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

  useEffect(() => {
    checkAuthentication();
  }, [navigate]);

  const checkAuthentication = () => {
    const userData = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated && userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      if (userObj.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }
      
      fetchAllAppointments();
    } else {
      navigate('/');
    }
  };

  const fetchAllAppointments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('https://tupt-counselingbackend.onrender.com/all-appointments');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments || []);
        applyFilters(data.appointments || [], statusFilter, selectedDate);
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple PDF Generation without autoTable
  const generatePDFReport = () => {
    // Create a simple HTML table for PDF
    const reportAppointments = getReportAppointments();
    
    let tableHTML = `
      <html>
        <head>
          <title>TUPT Counseling Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #c62828; text-align: center; }
            h2 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #c62828; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            .stat { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>TUPT Counseling Appointments Report</h1>
          <h2>${getReportTypeTitle()}</h2>
          <div class="summary">
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Appointments:</strong> ${reportAppointments.length}</p>
          </div>
    `;

    if (reportAppointments.length > 0) {
      tableHTML += `
        <table>
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Student Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Concern Type</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
      `;

      reportAppointments.forEach(apt => {
        tableHTML += `
          <tr>
            <td>${apt.user_info?.id_number || 'N/A'}</td>
            <td>${apt.user_info?.username || 'Unknown'}</td>
            <td>${formatDateForPDF(apt.date)}</td>
            <td>${apt.preferred_time}</td>
            <td>${apt.concern_type}</td>
            <td style="color: ${getStatusColor(apt.status)}">${apt.status}</td>
            <td>${new Date(apt.created_at).toLocaleDateString()}</td>
          </tr>
        `;
      });

      tableHTML += `
          </tbody>
        </table>
      `;
    } else {
      tableHTML += `<p style="text-align: center; color: #666;">No appointments found for this report.</p>`;
    }

    // Add statistics
    const stats = calculateStatistics();
    tableHTML += `<div class="summary"><h3>Summary Statistics</h3>`;
    stats.forEach(stat => {
      tableHTML += `<div class="stat"><strong>${stat.status}:</strong> ${stat.count} appointments</div>`;
    });
    tableHTML += `</div>`;

    tableHTML += `</body></html>`;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(tableHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generateDetailedPDFReport = () => {
    const reportAppointments = getReportAppointments();
    
    let detailedHTML = `
      <html>
        <head>
          <title>TUPT Counseling Detailed Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #c62828; text-align: center; }
            h2 { color: #333; }
            .appointment-card { 
              border: 1px solid #ddd; 
              margin: 15px 0; 
              padding: 15px; 
              border-radius: 5px; 
              background: #f9f9f9;
            }
            .appointment-header { 
              background: #c62828; 
              color: white; 
              padding: 10px; 
              margin: -15px -15px 15px -15px;
              border-radius: 5px 5px 0 0;
            }
            .appointment-detail { margin: 5px 0; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .stat { margin: 5px 0; }
            .status { 
              display: inline-block; 
              padding: 2px 8px; 
              border-radius: 3px; 
              font-weight: bold; 
              margin-left: 10px;
            }
          </style>
        </head>
        <body>
          <h1>TUPT Counseling - Detailed Appointments Report</h1>
          <h2>${getReportTypeTitle()}</h2>
          <div class="summary">
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p><strong>Total Records:</strong> ${reportAppointments.length}</p>
          </div>
    `;

    if (reportAppointments.length === 0) {
      detailedHTML += `<p style="text-align: center; color: #666; font-size: 18px;">No appointments found for this report.</p>`;
    } else {
      reportAppointments.forEach((apt, index) => {
        detailedHTML += `
          <div class="appointment-card">
            <div class="appointment-header">
              <strong>Appointment #${index + 1}</strong>
              <span class="status" style="background-color: ${getStatusColor(apt.status)}; color: white;">
                ${apt.status}
              </span>
            </div>
            <div class="appointment-detail"><strong>Student:</strong> ${apt.user_info?.username || 'Unknown'} (ID: ${apt.user_info?.id_number || 'N/A'})</div>
            <div class="appointment-detail"><strong>Date:</strong> ${formatDateForPDF(apt.date)}</div>
            <div class="appointment-detail"><strong>Time:</strong> ${apt.preferred_time}</div>
            <div class="appointment-detail"><strong>Concern Type:</strong> ${apt.concern_type}</div>
            <div class="appointment-detail"><strong>Scheduled on:</strong> ${new Date(apt.created_at).toLocaleString()}</div>
          </div>
        `;
      });
    }

    // Add summary
    const stats = calculateStatistics();
    detailedHTML += `<div class="summary"><h3>Report Summary</h3>`;
    stats.forEach(stat => {
      detailedHTML += `<div class="stat"><strong>${stat.status}:</strong> ${stat.count} appointments</div>`;
    });
    detailedHTML += `</div>`;

    detailedHTML += `</body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(detailedHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Alternative: Generate downloadable PDF using browser print
  const generateDownloadablePDF = () => {
    const reportAppointments = getReportAppointments();
    
    let content = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #c62828; text-align: center;">TUPT Counseling Appointments Report</h1>
        <h2 style="color: #333;">${getReportTypeTitle()}</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Appointments:</strong> ${reportAppointments.length}</p>
        </div>
    `;

    if (reportAppointments.length > 0) {
      content += `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #c62828; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID Number</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Time</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Concern Type</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      reportAppointments.forEach(apt => {
        content += `
          <tr style="border: 1px solid #ddd;">
            <td style="border: 1px solid #ddd; padding: 8px;">${apt.user_info?.id_number || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${apt.user_info?.username || 'Unknown'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${formatDateForPDF(apt.date)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${apt.preferred_time}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${apt.concern_type}</td>
            <td style="border: 1px solid #ddd; padding: 8px; color: ${getStatusColor(apt.status)};">${apt.status}</td>
          </tr>
        `;
      });

      content += `</tbody></table>`;
    }

    const stats = calculateStatistics();
    content += `<div style="background: #f9f9f9; padding: 15px; border-radius: 5px;"><h3>Summary Statistics</h3>`;
    stats.forEach(stat => {
      content += `<div style="margin: 5px 0;"><strong>${stat.status}:</strong> ${stat.count} appointments</div>`;
    });
    content += `</div></div>`;

    // Create a blob and download
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `counseling_report_${reportType}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getReportAppointments = () => {
    switch (reportType) {
      case 'all':
        return appointments;
      case 'approved':
        return appointments.filter(apt => apt.status === 'Approved');
      case 'rejected':
        return appointments.filter(apt => apt.status === 'Rejected');
      case 'filtered':
        return filteredAppointments;
      default:
        return appointments;
    }
  };

  const getReportTypeTitle = () => {
    switch (reportType) {
      case 'all': return 'All Appointments';
      case 'approved': return 'Approved Appointments';
      case 'rejected': return 'Rejected Appointments';
      case 'filtered': return `Filtered Appointments (${statusFilter})`;
      default: return 'Appointments Report';
    }
  };

  const calculateStatistics = () => {
    const reportApps = getReportAppointments();
    const statusCounts = {};
    
    statusOptions.forEach(status => {
      if (status !== 'All') {
        statusCounts[status] = reportApps.filter(apt => apt.status === status).length;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
  };

  const formatDateForPDF = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#FFA500';
      case 'Approved': return '#90EE90';
      case 'Rejected': return '#FF6B6B';
      case 'Cancelled': return '#B0B0B0';
      case 'Completed': return '#4CAF50';
      default: return '#FFFFFF';
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setError('');
      
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (appointment && appointment.status === 'Pending' && !['Approved', 'Rejected'].includes(newStatus)) {
        setError('Pending appointments can only be approved or rejected.');
        alert('Error: Pending appointments can only be approved or rejected.');
        return;
      }

      const response = await fetch(`https://tupt-counselingbackend.onrender.com/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppointments(prevAppointments => 
          prevAppointments.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: newStatus }
              : apt
          )
        );
        
        setFilteredAppointments(prevFiltered => 
          prevFiltered.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: newStatus }
              : apt
          )
        );
        
        alert(`Appointment ${newStatus.toLowerCase()} successfully!`);
      } else {
        throw new Error(data.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const applyFilters = (appts, statusFilter, date) => {
    let filtered = appts;
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    if (date) {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === date.toDateString();
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const handleStatusFilterChange = (e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    applyFilters(appointments, filter, selectedDate);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    applyFilters(appointments, statusFilter, date);
  };

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    applyFilters(appointments, status, selectedDate);
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Calendar component (keep the same as before)
  const Calendar = ({ onDateSelect, selectedDate, appointments }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const navigateMonth = (direction) => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + direction);
      setCurrentMonth(newMonth);
    };

    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendarDays = () => {
      const daysInMonth = getDaysInMonth(currentMonth);
      const firstDay = getFirstDayOfMonth(currentMonth);
      const days = [];

      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayAppointments = getAppointmentsForDate(date);
        const hasAppointments = dayAppointments.length > 0;
        const isSelected = date.toDateString() === selectedDate.toDateString();
        
        days.push(
          <div
            key={day}
            className={`calendar-day ${hasAppointments ? 'has-appointment' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => onDateSelect(date)}
            style={{
              background: isSelected ? 'rgba(198, 40, 40, 0.5)' : '',
              border: isSelected ? '2px solid #c62828' : ''
            }}
          >
            {day}
            {hasAppointments && <div className="appointment-dot"></div>}
          </div>
        );
      }

      return days;
    };

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
            ‹
          </button>
          <h3 className="calendar-month">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
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
          {renderCalendarDays()}
        </div>
        
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="appointment-dot"></div>
            <span>Has Appointments</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-gradient-background">
        <div className="dashboard-container">
          <div className="dashboard-box equal-box">
            <div style={{ textAlign: 'center', color: 'white' }}>
              Loading Admin Dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && error.includes('Access denied')) {
    return (
      <div className="dashboard-gradient-background">
        <div className="dashboard-container">
          <div className="dashboard-box equal-box">
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ color: '#ff6b6b', marginBottom: '20px' }}>{error}</div>
              <p>Redirecting to user dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-gradient-background">
      <div className="dashboard-container">
        <div className="dashboard-section">
          <div className="dashboard-layout">
            {/* Left Column - Calendar and Quick Stats */}
            <div className="column">
              <div className="dashboard-box equal-box">
                <div className="admin-header">
                  <h2 className="dashboard-title">Admin Dashboard</h2>
                  <div className="admin-welcome">
                    Welcome, {user?.username}
                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="dashboard-subtitle">Quick Stats</h3>
                  <div className="admin-stats-grid">
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#FFA500' }}>
                        {appointments.filter(apt => apt.status === 'Pending').length}
                      </div>
                      <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#90EE90' }}>
                        {appointments.filter(apt => apt.status === 'Approved').length}
                      </div>
                      <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#4CAF50' }}>
                        {appointments.filter(apt => apt.status === 'Completed').length}
                      </div>
                      <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#FF6B6B' }}>
                        {appointments.filter(apt => apt.status === 'Rejected').length}
                      </div>
                      <div className="stat-label">Rejected</div>
                    </div>
                  </div>
                </div>

                {/* PDF Report Generation */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="dashboard-subtitle">Generate Reports</h3>
                  <div className="report-controls">
                    <select 
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="report-select"
                    >
                      <option value="all">All Appointments</option>
                      <option value="approved">Approved Only</option>
                      <option value="rejected">Rejected Only</option>
                      <option value="filtered">Current Filter</option>
                    </select>
                    
                    <div className="report-buttons">
                      <button 
                        onClick={generatePDFReport}
                        className="report-btn summary"
                      >
                        Print Summary Report
                      </button>
                      <button 
                        onClick={generateDetailedPDFReport}
                        className="report-btn detailed"
                      >
                        Print Detailed Report
                      </button>
                      <button 
                        onClick={generateDownloadablePDF}
                        className="report-btn download"
                      >
                        Download HTML Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                <Calendar 
                  onDateSelect={handleDateChange}
                  selectedDate={selectedDate}
                  appointments={appointments}
                />
              </div>
            </div>

            {/* Right Column - Appointments Management */}
            <div className="column">
              <div className="dashboard-box equal-box">
                <h2 className="dashboard-title">Appointments Management</h2>
                
                {error && !error.includes('Access denied') && (
                  <div className="error-message" style={{ 
                    background: 'rgba(255, 107, 107, 0.2)', 
                    color: '#FF6B6B', 
                    padding: '10px', 
                    borderRadius: '5px', 
                    marginBottom: '15px',
                    border: '1px solid #FF6B6B'
                  }}>
                    {error}
                  </div>
                )}
                
                {/* Filter Controls */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="filter-controls">
                    <label>Filter by Status:</label>
                    <select 
                      value={statusFilter} 
                      onChange={handleStatusFilterChange}
                      className="status-select"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="status-filters">
                    {statusOptions.filter(s => s !== 'All').map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilterClick(status)}
                        className={`status-filter-btn ${statusFilter === status ? 'active' : ''}`}
                        style={{
                          background: statusFilter === status ? getStatusColor(status) : 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appointments List */}
                <div className="history-section">
                  <h3 className="section-title">
                    Appointments ({filteredAppointments.length})
                    {statusFilter !== 'All' && ` - ${statusFilter}`}
                    {selectedDate && ` - ${selectedDate.toLocaleDateString()}`}
                  </h3>
                  
                  <div className="appointments-list">
                    {filteredAppointments.length === 0 ? (
                      <div className="no-appointments">
                        No appointments found
                        {statusFilter !== 'All' && ` with status: ${statusFilter}`}
                        {selectedDate && ` on ${selectedDate.toLocaleDateString()}`}
                      </div>
                    ) : (
                      filteredAppointments.map(appointment => (
                        <div key={appointment._id} className="appointment-item">
                          <div className="appointment-header">
                            <div className="appointment-date">
                              {formatDate(appointment.date)}
                            </div>
                            <div 
                              className="appointment-status"
                              style={{
                                background: `rgba(${getStatusColor(appointment.status).replace('#', '')}, 0.2)`,
                                color: getStatusColor(appointment.status),
                                border: `1px solid ${getStatusColor(appointment.status)}`
                              }}
                            >
                              {appointment.status}
                            </div>
                          </div>
                          
                          <div className="appointment-details">
                            <div className="appointment-info">
                              <div className="appointment-time">
                                <strong>Time:</strong> {appointment.preferred_time}
                              </div>
                              <div className="appointment-concern">
                                <strong>Concern:</strong> {appointment.concern_type}
                              </div>
                              <div className="appointment-user">
                                <strong>Student:</strong> {appointment.user_info?.username || 'Unknown'} 
                                ({appointment.user_info?.id_number || 'N/A'})
                              </div>
                              <div className="appointment-created">
                                <strong>Scheduled:</strong> {new Date(appointment.created_at).toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="appointment-actions">
                              {appointment.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Approved')}
                                    className="action-btn approve"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Rejected')}
                                    className="action-btn reject"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {appointment.status === 'Approved' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Completed')}
                                    className="action-btn complete"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Cancelled')}
                                    className="action-btn cancel"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {(appointment.status === 'Rejected' || appointment.status === 'Cancelled') && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'Pending')}
                                  className="action-btn reset"
                                >
                                  Reset to Pending
                                </button>
                              )}
                              {appointment.status === 'Completed' && (
                                <div className="completed-text" style={{color: '#4CAF50', fontStyle: 'italic'}}>
                                  Completed - No actions available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;