import React from 'react';
import StaffLeaveRegistry from '../../../admcomponents/StaffLeaveRegistry';

const CounsellorLeave = ({ toggleSidebar }) => {
    return (
        <div className="font-sans text-left">
            <StaffLeaveRegistry 
                toggleSidebar={toggleSidebar} 
                roleTitle="COUNSELLOR" 
            />
        </div>
    );
};

export default CounsellorLeave;
