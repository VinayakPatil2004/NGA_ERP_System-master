const ViewProfile = () => {
  const teacher = JSON.parse(localStorage.getItem("grace_erp_user")) || {};

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Profile</h2>

      <div className="bg-white p-6 rounded-2xl shadow">
        <p><b>Name:</b> {teacher?.fullName || teacher?.full_name || teacher?.username}</p>
        <p><b>Email:</b> {teacher?.email}</p>
      </div>
    </div>
  );
};

export default ViewProfile;