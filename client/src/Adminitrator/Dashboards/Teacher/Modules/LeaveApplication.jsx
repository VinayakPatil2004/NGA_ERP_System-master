import React from "react";
import StaffLeaveRegistry from "../../../admcomponents/StaffLeaveRegistry";

/**
 * Teacher Leave Application Module
 * Utilizing the unified StaffLeaveRegistry for consistent branding and logic.
 */
const LeaveApplication = ({ toggleSidebar }) => {
    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen animate-in fade-in duration-500 font-sans text-left">
            <StaffLeaveRegistry toggleSidebar={toggleSidebar} roleTitle="TEACHER" />
        </div>
    );
};

export default LeaveApplication;
