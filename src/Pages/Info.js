import React from 'react';
import './Auth/Login.css'; // Reusing the same CSS

const Info = () => {
  return (
    <div className="home-container">
      <section className="login-section">
        <div className="login-box">
          {/* Main Title */}
          <h2 className="login-title">TUPT Counseling Scheduler</h2>
          
          {/* Subtitle */}
          <div className="login-subtitle">Information & Help</div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
              About the System
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5', marginBottom: '15px' }}>
              The TUPT Counseling Scheduler is designed to help students easily schedule appointments 
              with university counselors. Our system provides a secure and efficient way to manage 
              your counseling sessions.
            </p>
            
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
              Why We Developed This System
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5', marginBottom: '15px' }}>
              This system was developed to address the challenges students face in scheduling counseling 
              appointments through traditional methods. We aimed to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5', paddingLeft: '20px', marginBottom: '15px' }}>
              <li>Streamline the appointment scheduling process</li>
              <li>Reduce waiting times and administrative overhead</li>
              <li>Provide 24/7 access to scheduling services</li>
              <li>Ensure privacy and security of student information</li>
              <li>Improve communication between students and counselors</li>
              <li>Enhance the overall counseling experience for TUPT students</li>
            </ul>
            
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
              How to Use
            </h3>
            <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5', paddingLeft: '20px', marginBottom: '15px' }}>
              <li>Login with your student credentials</li>
              <li>Schedule appointments with available counselors</li>
              <li>View your upcoming sessions</li>
              <li>Cancel or reschedule appointments if needed</li>
              <li>Receive notifications and reminders</li>
            </ul>
            
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
              Developers
            </h3>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5', marginBottom: '15px' }}>
              <p>This system was developed by the TUPT IT Department in collaboration with the Counseling Office to enhance student services and support.</p>
              <p><strong>Development Team:</strong></p>
              <ul style={{ paddingLeft: '20px' }}>
                <li>TUPT IT Department</li>
                <li>Software Engineering Team</li>
                <li>Counseling Office Staff</li>
                <li>Student Representatives</li>
              </ul>
              <p><strong>For technical support:</strong> it-support@tupt.edu.ph</p>
            </div>
            
            <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
              Contact Information
            </h3>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5' }}>
              <p><strong>Counseling Office:</strong> (02) 123-4567</p>
              <p><strong>Email:</strong> counseling@tupt.edu.ph</p>
              <p><strong>Office Hours:</strong> Mon-Fri, 8:00 AM - 5:00 PM</p>
              <p><strong>Location:</strong> Main Building, 2nd Floor</p>
            </div>
          </div>
          
          {/* Back to Login Link */}
          <div className="more-info-container">
            <a href="/" className="more-info-link">
              ← Back to Login
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Info;