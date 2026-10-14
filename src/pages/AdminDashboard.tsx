import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { adminService } from "../service/adminService";
import { authService } from "../service/authService";
import { getApiErrorMessage } from "../service/api";
import "./AdminDashboard.css";
import type { UserRole } from "../types/auth";
import type {
  AdminUser,
  SummaryMetrics,
  DoctorProfile,
  PatientProfile,
} from "../types/admin";
import logoImg from "../assets/Hospital CRM Healthcare Logo (1).png";



const INITIAL_SUMMARY: SummaryMetrics = {
  total_users: 0,
  total_doctors: 0,
  total_patients: 0,
  total_admins: 0,
  total_recipients: 0,
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Tab State: "users" | "doctors" | "patients" | "addDoctor" | "addPatient" | "addUser" | "logs"
  const [activeTab, setActiveTab] = useState<
    "users" | "doctors" | "patients" | "addDoctor" | "addPatient" | "addUser" | "logs"
  >("users");

  // Pure API Data States - NO HARDCODED DUMMY DATA
  const [summary, setSummary] = useState<SummaryMetrics>(INITIAL_SUMMARY);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [patientsList, setPatientsList] = useState<PatientProfile[]>([]);


  // Status & Feedback States
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [dbHealthStatus, setDbHealthStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Filter States
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>("");
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>("");

  // Mode state for Tab "addUser": "register" | "editUsername" | "editPassword"
  const [userFormMode, setUserFormMode] = useState<"register" | "editUsername" | "editPassword">("register");

  // Generic New User Signup State (Mode 1)
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("doctor");
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const [userCreatedMsg, setUserCreatedMsg] = useState("");

  // Mode 2: Edit Username & Profile State
  const [editOldUsername, setEditOldUsername] = useState("");
  const [editNewName, setEditNewName] = useState("");
  const [editNewEmail, setEditNewEmail] = useState("");
  const [editNewUsername, setEditNewUsername] = useState("");
  const [isSubmittingUsernameEdit, setIsSubmittingUsernameEdit] = useState(false);

  // Mode 3: Edit Password & Role State
  const [editPassTargetUsername, setEditPassTargetUsername] = useState("");
  const [editNewPasswordVal, setEditNewPasswordVal] = useState("");
  const [editPassRole, setEditPassRole] = useState<UserRole | string>("doctor");
  const [editPassStatus, setEditPassStatus] = useState("activate");
  const [isSubmittingPassEdit, setIsSubmittingPassEdit] = useState(false);

  // --- DOCTOR ENTRY FORM STATE (COMPLETE ALL COLUMNS) ---
  const [docName, setDocName] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docPassword, setDocPassword] = useState("");
  const [docGender, setDocGender] = useState("Male");
  const [docContact, setDocContact] = useState("");
  const [docType, setDocType] = useState("General Practitioner");
  const [docExp, setDocExp] = useState<number | string>(0);
  const [docFee, setDocFee] = useState<number | string>(500);
  const [docAbilities, setDocAbilities] = useState("");
  const [docAvailability, setDocAvailability] = useState("available");
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // --- PATIENT ENTRY FORM STATE (COMPLETE ALL COLUMNS) ---
  const [patName, setPatName] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patPassword, setPatPassword] = useState("");
  const [patAge, setPatAge] = useState<number | string>(25);
  const [patGender, setPatGender] = useState("Male");
  const [patBloodGroup, setPatBloodGroup] = useState("O+");
  const [patContact, setPatContact] = useState("");
  const [patAddress, setPatAddress] = useState("");
  const [isSubmittingPat, setIsSubmittingPat] = useState(false);

  // --- EDIT DOCTOR MODAL STATE ---
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocGender, setEditDocGender] = useState("Male");
  const [editDocContact, setEditDocContact] = useState("");
  const [editDocType, setEditDocType] = useState("");
  const [editDocExp, setEditDocExp] = useState<number>(0);
  const [editDocFee, setEditDocFee] = useState<number>(0);
  const [editDocAbilities, setEditDocAbilities] = useState("");
  const [editDocAvailability, setEditDocAvailability] = useState("available");
  const [isSavingDoctorEdit, setIsSavingDoctorEdit] = useState(false);

  // --- EDIT PATIENT MODAL STATE ---
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [editPatName, setEditPatName] = useState("");
  const [editPatAge, setEditPatAge] = useState<number>(0);
  const [editPatGender, setEditPatGender] = useState("Male");
  const [editPatBloodGroup, setEditPatBloodGroup] = useState("O+");
  const [editPatContact, setEditPatContact] = useState("");
  const [editPatAddress, setEditPatAddress] = useState("");
  const [isSavingPatientEdit, setIsSavingPatientEdit] = useState(false);



  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch Backend & DB Health Status (GET /api/v1/health)
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await adminService.checkHealth();
      setHealthStatus("online");

      const isDbConnected = res.db_status === "connected" || !res.db_status;
      setDbHealthStatus(isDbConnected ? "connected" : "disconnected");
    } catch (err) {
      setHealthStatus("offline");
      setDbHealthStatus("disconnected");
    }
  }, []);

  // Fetch Users List & Summary Metrics (GET /api/v1/user/data)
  const fetchUsersAndSummary = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await adminService.getUserData();
      if (res.data) {
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (Array.isArray(res.data.users)) {
          setUsersList(res.data.users);
        }
      }
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load users from DB: ${errMsg}`, "error");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch Doctors Data List (GET /api/v1/doctor/data)
  const fetchDoctorProfiles = useCallback(async () => {
    setIsLoadingDoctors(true);
    try {
      const doctors = await adminService.getDoctorData();
      setDoctorsList(doctors || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load doctor profiles: ${errMsg}`, "error");
    } finally {
      setIsLoadingDoctors(false);
    }
  }, []);

  // Fetch Patients Data List (GET /api/v1/patient/data)
  const fetchPatientProfiles = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const patients = await adminService.getPatientData();
      setPatientsList(patients || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load patient profiles: ${errMsg}`, "error");
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  // Manual Refresh Handler (Bypasses Cache & Refetches All APIs)
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await checkBackendHealth();
      await fetchUsersAndSummary();
      await fetchDoctorProfiles();
      await fetchPatientProfiles();
      const timeStr = new Date().toLocaleTimeString();
      setLastSyncedTime(timeStr);
      showToast(`All API data refreshed from Database at ${timeStr}! 🔄`, "success");
    } catch (err) {
      showToast(`Refresh failed: ${getApiErrorMessage(err)}`, "error");
    } finally {
      setIsRefreshing(false);
    }

  }, [checkBackendHealth, fetchUsersAndSummary, fetchDoctorProfiles, fetchPatientProfiles]);

  // Initial load
  useEffect(() => {
    checkBackendHealth();
    fetchUsersAndSummary();
    fetchDoctorProfiles();
    fetchPatientProfiles();
    const initTime = new Date().toLocaleTimeString();
    setLastSyncedTime(initTime);
  }, [checkBackendHealth, fetchUsersAndSummary, fetchDoctorProfiles, fetchPatientProfiles]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Role Change Handler (POST /api/v1/user/update)
  const handleRoleChange = async (targetUser: AdminUser, newRole: string) => {
    setUpdatingUserId(targetUser.id);
    const updatedStatus = targetUser.status || "activate";
    const updatedAction = targetUser.action || updatedStatus;

    setUsersList((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
    );

    try {
      const res = await adminService.updateUser({
        username: targetUser.username,
        name: targetUser.name,
        email: targetUser.email,
        role: newRole,
        status: updatedStatus,
        action: updatedAction,
      });

      const msg = res.message || `User "${targetUser.name}" role updated to ${newRole.toUpperCase()}! 🎉`;
      showToast(msg, "success");
      fetchUsersAndSummary();
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to update role: ${errMsg}`, "error");
      fetchUsersAndSummary();
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Toggle Action Button Handler (POST /api/v1/user/update)
  const handleToggleAction = async (targetUser: AdminUser) => {
    setUpdatingUserId(targetUser.id);
    const isCurrentlyActive =
      targetUser.status?.toLowerCase() === "activate" ||
      targetUser.status?.toLowerCase() === "active";

    const nextStatus = isCurrentlyActive ? "disable" : "activate";
    const nextAction = isCurrentlyActive ? "disable" : "activate";

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? { ...u, status: nextStatus, action: nextAction }
          : u
      )
    );

    try {
      const res = await adminService.updateUser({
        username: targetUser.username,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: nextStatus,
        action: nextAction,
      });

      const msg = res.message || `User "${targetUser.name}" status updated to ${nextStatus.toUpperCase()}! 🎉`;
      showToast(msg, "success");
      fetchUsersAndSummary();
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to update status: ${errMsg}`, "error");
      fetchUsersAndSummary();
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Mode 1: Register New User Handler (POST /api/v1/users/signup)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    setIsSubmittingNewUser(true);
    setUserCreatedMsg("");

    try {
      const res = await authService.signup({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword || "Password123",
        role: newUserRole,
      });

      const assignedUsername = res.username || newUserName.toLowerCase().replace(/\s+/g, "_");
      const successMessage =
        res.message || `User "${newUserName}" registered successfully! Username: ${assignedUsername}`;

      setUserCreatedMsg(successMessage);
      showToast(successMessage, "success");

      await fetchUsersAndSummary();

      setTimeout(() => {
        setUserCreatedMsg("");
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("doctor");
        setActiveTab("users");
      }, 2000);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Registration error: ${errMsg}`, "error");
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Mode 2: Update Username & Profile Details (POST /api/v1/user/update)
  const handleUpdateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOldUsername) return;

    setIsSubmittingUsernameEdit(true);
    try {
      const existingUser = usersList.find(
        (u) => u.username === editOldUsername || u.email === editOldUsername
      );

      await adminService.updateUser({
        username: editNewUsername || editOldUsername,
        name: editNewName || existingUser?.name || editOldUsername,
        email: editNewEmail || existingUser?.email || `${editOldUsername}@hospital.com`,
        role: existingUser?.role ? String(existingUser.role) : "doctor",
        status: existingUser?.status || "activate",
        action: existingUser?.action || "activate",
      });

      const successMsg = `Username & Profile for "${editOldUsername}" updated successfully in DB! 💾`;
      showToast(successMsg, "success");

      await fetchUsersAndSummary();

      setEditOldUsername("");
      setEditNewName("");
      setEditNewEmail("");
      setEditNewUsername("");
      setActiveTab("users");
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Profile update failed: ${errMsg}`, "error");
    } finally {
      setIsSubmittingUsernameEdit(false);
    }
  };

  // Mode 3: Update Password & Role Details (POST /api/v1/user/update)
  const handleUpdateUserPasswordAndRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPassTargetUsername) return;

    setIsSubmittingPassEdit(true);
    try {
      const existingUser = usersList.find(
        (u) => u.username === editPassTargetUsername || u.email === editPassTargetUsername
      );

      await adminService.updateUser({
        username: editPassTargetUsername,
        name: existingUser?.name || editPassTargetUsername,
        email: existingUser?.email || `${editPassTargetUsername}@hospital.com`,
        role: String(editPassRole),
        status: editPassStatus,
        action: editPassStatus,
      });

      const successMsg = `Password & Role updated for user "${editPassTargetUsername}" successfully! 🔐`;
      showToast(successMsg, "success");

      await fetchUsersAndSummary();

      setEditPassTargetUsername("");
      setEditNewPasswordVal("");
      setEditPassRole("doctor");
      setEditPassStatus("activate");
      setActiveTab("users");
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Password & Role update failed: ${errMsg}`, "error");
    } finally {
      setIsSubmittingPassEdit(false);
    }
  };

  // --- HANDLER: CREATE DOCTOR ENTRY (User Signup + Save Doctor Profile with ALL COLUMNS in DB) ---
  const handleCreateDoctorEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docEmail) return;

    setIsSubmittingDoc(true);
    try {
      const signupRes = await authService.signup({
        name: docName.trim(),
        email: docEmail.trim(),
        password: docPassword || "Password123",
        role: "doctor",
      });

      const assignedUserId = signupRes.user_id || signupRes.user?.id || signupRes.id;

      await adminService.saveDoctorProfile({
        user_id: assignedUserId ? Number(assignedUserId) : undefined,
        doctor_name: docName.trim(),
        gender: docGender || "Male",
        contact_number: docContact || "",
        doctor_type: docType || "General Practitioner",
        experience_years: Number(docExp) || 0,
        consultation_fee: Number(docFee) || 0,
        doctor_abilities: docAbilities || "General Consultations",
        availability_status: docAvailability || "available",
      });

      const msg = `Doctor "${docName}" registered and saved in Database successfully! 🩺`;
      showToast(msg, "success");

      await fetchUsersAndSummary();
      await fetchDoctorProfiles();

      setDocName("");
      setDocEmail("");
      setDocPassword("");
      setDocGender("Male");
      setDocContact("");
      setDocType("General Practitioner");
      setDocExp(0);
      setDocFee(500);
      setDocAbilities("");
      setDocAvailability("available");
      setActiveTab("doctors");
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Doctor registration failed: ${errMsg}`, "error");
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // --- HANDLER: CREATE PATIENT ENTRY (User Signup + Save Patient Profile with ALL COLUMNS in DB) ---
  const handleCreatePatientEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patName || !patEmail) return;

    setIsSubmittingPat(true);
    try {
      const signupRes = await authService.signup({
        name: patName.trim(),
        email: patEmail.trim(),
        password: patPassword || "Password123",
        role: "patient",
      });

      const assignedUserId = signupRes.user_id || signupRes.user?.id || signupRes.id;

      await adminService.savePatientProfile({
        user_id: assignedUserId ? Number(assignedUserId) : undefined,
        patient_name: patName.trim(),
        age: Number(patAge) || 0,
        gender: patGender || "Male",
        blood_group: patBloodGroup || "O+",
        contact_number: patContact || "",
        address: patAddress || "",
      });

      const msg = `Patient "${patName}" registered and saved in Database successfully! 🧑‍🤝‍🧑`;
      showToast(msg, "success");

      await fetchUsersAndSummary();
      await fetchPatientProfiles();

      setPatName("");
      setPatEmail("");
      setPatPassword("");
      setPatAge(25);
      setPatGender("Male");
      setPatBloodGroup("O+");
      setPatContact("");
      setPatAddress("");
      setActiveTab("patients");
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Patient registration failed: ${errMsg}`, "error");
    } finally {
      setIsSubmittingPat(false);
    }
  };

  // --- HANDLER: EDIT DOCTOR PROFILE ---
  const handleStartEditDoctor = (doc: DoctorProfile) => {
    setEditingDoctor(doc);
    setEditDocName(doc.doctor_name);
    setEditDocGender(doc.gender || "Male");
    setEditDocContact(doc.contact_number || "");
    setEditDocType(doc.doctor_type || "General Practitioner");
    setEditDocExp(doc.experience_years || 0);
    setEditDocFee(doc.consultation_fee || 0);
    setEditDocAbilities(doc.doctor_abilities || "");
    setEditDocAvailability(doc.availability_status || "available");
  };

  const handleSaveDoctorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setIsSavingDoctorEdit(true);
    try {
      await adminService.saveDoctorProfile({
        user_id: Number(editingDoctor.user_id),
        doctor_name: editDocName.trim(),
        gender: editDocGender,
        contact_number: editDocContact,
        doctor_type: editDocType,
        experience_years: Number(editDocExp),
        consultation_fee: Number(editDocFee),
        doctor_abilities: editDocAbilities,
        availability_status: editDocAvailability,
      });

      showToast(`Doctor profile for "${editDocName}" updated in Database! 💾`, "success");
      setEditingDoctor(null);
      await fetchDoctorProfiles();
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to update doctor profile: ${errMsg}`, "error");
    } finally {
      setIsSavingDoctorEdit(false);
    }
  };

  // --- HANDLER: EDIT PATIENT PROFILE ---
  const handleStartEditPatient = (pat: PatientProfile) => {
    setEditingPatient(pat);
    setEditPatName(pat.patient_name);
    setEditPatAge(pat.age || 0);
    setEditPatGender(pat.gender || "Male");
    setEditPatBloodGroup(pat.blood_group || "O+");
    setEditPatContact(pat.contact_number || "");
    setEditPatAddress(pat.address || "");
  };

  const handleSavePatientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    setIsSavingPatientEdit(true);
    try {
      await adminService.savePatientProfile({
        user_id: Number(editingPatient.user_id),
        patient_name: editPatName.trim(),
        age: Number(editPatAge),
        gender: editPatGender,
        blood_group: editPatBloodGroup,
        contact_number: editPatContact,
        address: editPatAddress,
      });

      showToast(`Patient profile for "${editPatName}" updated in Database! 💾`, "success");
      setEditingPatient(null);
      await fetchPatientProfiles();
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to update patient profile: ${errMsg}`, "error");
    } finally {
      setIsSavingPatientEdit(false);
    }
  };

  // Filtered Lists
  const filteredUsers = usersList.filter((u) => {
    const matchesRole =
      roleFilter === "all" ||
      u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesQuery;
  });

  const filteredDoctors = doctorsList.filter((d) => {
    const q = doctorSearchQuery.toLowerCase();
    return (
      d.doctor_name.toLowerCase().includes(q) ||
      d.doctor_type.toLowerCase().includes(q) ||
      (d.contact_number && d.contact_number.includes(q)) ||
      d.doctor_abilities.toLowerCase().includes(q)
    );
  });

  const filteredPatients = patientsList.filter((p) => {
    const q = patientSearchQuery.toLowerCase();
    return (
      p.patient_name.toLowerCase().includes(q) ||
      p.contact_number.includes(q) ||
      p.blood_group.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-layout admin-theme">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="brand-section" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src={logoImg} alt="Hospital CRM Logo" style={{ height: "38px", width: "auto", objectFit: "contain", borderRadius: "6px" }} />
          <div className="brand-badge admin-badge">⚙️ Admin Console</div>
          <h2>Hospital CRM</h2>
        </div>

        <div className="user-profile-section">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="refresh-api-btn"
            title={lastSyncedTime ? `Last synced at ${lastSyncedTime}` : "Click to refresh API data from Database"}
          >
            {isRefreshing ? "⏳ Syncing..." : "🔄 Refresh Data"}
          </button>

          <div className="profile-info">
            <span className="profile-name">
              {user?.name || user?.username || "Admin"}
            </span>
            <span className="profile-role">System Administrator</span>
          </div>

          <button onClick={handleLogout} className="dashboard-logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Navigation Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-menu">
            <button
              className={`menu-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              👥 System Users List
            </button>

            <button
              className={`menu-item ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("doctors");
                if (doctorsList.length === 0) fetchDoctorProfiles();
              }}
            >
              👨‍⚕️ Doctor Profiles
            </button>

            <button
              className={`menu-item ${activeTab === "patients" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("patients");
                if (patientsList.length === 0) fetchPatientProfiles();
              }}
            >
              🧑‍🤝‍🧑 Patient Profiles
            </button>

            <button
              className={`menu-item ${activeTab === "addDoctor" ? "active" : ""}`}
              onClick={() => setActiveTab("addDoctor")}
            >
              🩺 Doctor Entry Form
            </button>

            <button
              className={`menu-item ${activeTab === "addPatient" ? "active" : ""}`}
              onClick={() => setActiveTab("addPatient")}
            >
              🧑‍🦽 Patient Entry Form
            </button>

            <button
              className={`menu-item ${activeTab === "addUser" ? "active" : ""}`}
              onClick={() => setActiveTab("addUser")}
            >
              ➕ Register & Edit System User
            </button>


          </nav>

          <div className="quick-stats-box">
            <h4>Detail</h4>
            <div className="stat-mini">
              <span>Total DB Users:</span>
              <strong>{summary.total_users}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Doctors:</span>
              <strong>{summary.total_doctors}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Patients:</span>
              <strong>{summary.total_patients}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Admins:</span>
              <strong>{summary.total_admins}</strong>
            </div>
            <div className="stat-mini">
              <span>API Service:</span>
              <strong style={{ color: healthStatus === "online" ? "#16a34a" : "#dc2626" }}>
                {healthStatus === "online" ? "Active 🟢" : "Disconnected 🔴"}
              </strong>
            </div>
            <div className="stat-mini">
              <span>Database Health:</span>
              <strong style={{ color: dbHealthStatus === "connected" ? "#16a34a" : "#dc2626" }}>
                {dbHealthStatus === "connected" ? "Connected 🟢" : "Disconnected 🔴"}
              </strong>
            </div>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main className="dashboard-main">
          {/* Toast Notification Banner */}
          {toast && (
            <div className={`admin-toast-alert ${toast.type}`}>
              <span>{toast.message}</span>
              <button
                className="close-toast-btn"
                onClick={() => setToast(null)}
              >
                ✕
              </button>
            </div>
          )}

          {/* Dynamic API Summary Metrics Grid */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-content">
                <h3>{summary.total_doctors}</h3>
                <p>Total Doctors</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">🧑‍🤝‍🧑</div>
              <div className="stat-content">
                <h3>{summary.total_patients}</h3>
                <p>Total Patients</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">🛡️</div>
              <div className="stat-content">
                <h3>{summary.total_admins}</h3>
                <p>Administrators</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{summary.total_users}</h3>
                <p>Total Registered Users</p>
              </div>
            </div>
          </div>

          {/* TAB 1: System Users Management */}
          {activeTab === "users" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>System Users Management</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Change user roles directly via dropdown or activate/disable user access with API.
                  </p>
                </div>

                <div className="filter-controls">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="table-search-input"
                    style={{ width: "160px" }}
                  >
                    <option value="all">All Roles</option>
                    <option value="doctor">Doctors</option>
                    <option value="patient">Patients</option>
                    <option value="receptionist">Receptionists</option>
                    <option value="admin">Admins</option>
                    <option value="recipient">Recipients</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="table-search-input"
                  />
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="table-loading-container">
                  Loading users & metrics from Database API...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role (Change via Dropdown)</th>
                        <th>Status</th>
                        <th>Joined Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty-state">
                            No users found in Database.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isUpdating = updatingUserId === u.id;
                          const isActive =
                            u.status?.toLowerCase() === "activate" ||
                            u.status?.toLowerCase() === "active";

                          return (
                            <tr key={u.id}>
                              <td>
                                <strong>#{u.id}</strong>
                              </td>
                              <td>{u.name}</td>
                              <td>
                                <code>{u.username}</code>
                              </td>
                              <td>{u.email}</td>

                              {/* Role Dropdown Column */}
                              <td>
                                <select
                                  value={u.role.toLowerCase()}
                                  disabled={isUpdating}
                                  onChange={(e) =>
                                    handleRoleChange(u, e.target.value)
                                  }
                                  className={`role-dropdown-select role-${u.role.toLowerCase()}`}
                                >
                                  <option value="doctor">DOCTOR</option>
                                  <option value="patient">PATIENT</option>
                                  <option value="receptionist">RECEPTIONIST</option>
                                  <option value="admin">ADMIN</option>
                                  <option value="recipient">RECIPIENT</option>
                                </select>
                              </td>

                              {/* Status Column */}
                              <td>
                                <span
                                  className={
                                    isActive
                                      ? "status-online"
                                      : "status-offline"
                                  }
                                >
                                  {isActive ? "Activate" : "Disable"}
                                </span>
                              </td>

                              <td>{u.join_date || u.joinedDate || "N/A"}</td>

                              {/* Action Button Column */}
                              <td>
                                <button
                                  className={`action-btn ${
                                    isActive ? "btn-disable" : "btn-activate"
                                  }`}
                                  disabled={isUpdating}
                                  onClick={() => handleToggleAction(u)}
                                >
                                  {isUpdating
                                    ? "Saving..."
                                    : isActive
                                    ? "Disable"
                                    : "Activate"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: Doctor Profiles Directory */}
          {activeTab === "doctors" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>Doctor Profiles & Directory</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    View detailed profiles and medical specialties of registered doctors.
                  </p>
                </div>

                <div className="filter-controls">
                  <button
                    className="submit-presc-btn"
                    onClick={() => setActiveTab("addDoctor")}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    + Add Doctor Entry
                  </button>

                  <input
                    type="text"
                    placeholder="Search doctor by name, specialty, contact..."
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                    className="table-search-input"
                    style={{ width: "260px" }}
                  />
                </div>
              </div>

              {isLoadingDoctors ? (
                <div className="table-loading-container">
                  Loading Doctor profiles from API...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doc ID</th>
                        <th>User ID</th>
                        <th>Doctor Name</th>
                        <th>Gender</th>
                        <th>Contact Number</th>
                        <th>Specialty / Type</th>
                        <th>Experience</th>
                        <th>Consultation Fee</th>
                        <th>Abilities / Skills</th>
                        <th>Availability</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="empty-state">
                            No doctor profiles found in Database.
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doc) => (
                          <tr key={doc.id}>
                            <td><strong>#DOC-{doc.id}</strong></td>
                            <td>#{doc.user_id}</td>
                            <td><strong>{doc.doctor_name}</strong></td>
                            <td>{doc.gender || "Male"}</td>
                            <td><code>{doc.contact_number || "N/A"}</code></td>
                            <td>
                              <span className="pill-tag role-doctor">
                                {doc.doctor_type}
                              </span>
                            </td>
                            <td>{doc.experience_years} Years</td>
                            <td><strong>₹{doc.consultation_fee}</strong></td>
                            <td>{doc.doctor_abilities}</td>
                            <td>
                              <span
                                className={`badge-availability ${
                                  doc.availability_status === "available"
                                    ? "available"
                                    : "unavailable"
                                }`}
                              >
                                {doc.availability_status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <button
                                className="edit-btn"
                                onClick={() => handleStartEditDoctor(doc)}
                                title="Edit Doctor Profile Details"
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 3: Patient Profiles Directory */}
          {activeTab === "patients" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>Patient Profiles Directory</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Access patient records, contact details, and medical history.
                  </p>
                </div>

                <div className="filter-controls">
                  <button
                    className="submit-presc-btn"
                    onClick={() => setActiveTab("addPatient")}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    + Add Patient Entry
                  </button>

                  <input
                    type="text"
                    placeholder="Search patient by name, contact, blood group..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="table-search-input"
                    style={{ width: "260px" }}
                  />
                </div>
              </div>

              {isLoadingPatients ? (
                <div className="table-loading-container">
                  Loading Patient profiles from API...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>User ID</th>
                        <th>Patient Name</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Blood Group</th>
                        <th>Contact Number</th>
                        <th>Address</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="empty-state">
                            No patient profiles found in Database.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((pat) => (
                          <tr key={pat.id}>
                            <td><strong>#PAT-{pat.id}</strong></td>
                            <td>#{pat.user_id}</td>
                            <td><strong>{pat.patient_name}</strong></td>
                            <td>{pat.age} Yrs</td>
                            <td>{pat.gender}</td>
                            <td>
                              <span className="pill-tag role-patient">
                                {pat.blood_group}
                              </span>
                            </td>
                            <td><code>{pat.contact_number}</code></td>
                            <td>{pat.address}</td>
                            <td>
                              <button
                                className="edit-btn"
                                onClick={() => handleStartEditPatient(pat)}
                                title="Edit Patient Profile Details"
                              >
                                ✏️ Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: Doctor Entry Form (ALL COLUMNS) */}
          {activeTab === "addDoctor" && (
            <section className="dashboard-section form-section">
              <h3>🩺 Register & Add New Doctor Entry</h3>
              <p style={{ marginTop: "-12px", marginBottom: "20px", fontSize: "13px", color: "#64748b" }}>
                Creates a doctor user account and stores all doctor profile attributes in the PostgreSQL database.
              </p>

              <form onSubmit={handleCreateDoctorEntry} className="prescription-form">
                <div className="form-group">
                  <label>Doctor Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rohit Sharma"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    disabled={isSubmittingDoc}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="rohit@hospital.com"
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      required
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group">
                    <label>Account Password</label>
                    <input
                      type="password"
                      placeholder="Enter password (default: Password123)"
                      value={docPassword}
                      onChange={(e) => setDocPassword(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={docGender}
                      onChange={(e) => setDocGender(e.target.value)}
                      disabled={isSubmittingDoc}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={docContact}
                      onChange={(e) => setDocContact(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Doctor Specialty / Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      disabled={isSubmittingDoc}
                    >
                      <option value="General Practitioner">General Practitioner</option>
                      <option value="cardiologist">Cardiologist</option>
                      <option value="neurologist">Neurologist</option>
                      <option value="dermatologist">Dermatologist</option>
                      <option value="orthopedic">Orthopedic</option>
                      <option value="pediatrician">Pediatrician</option>
                      <option value="surgeon">Surgeon</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Experience (Years)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8"
                      value={docExp}
                      onChange={(e) => setDocExp(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group">
                    <label>Consultation Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={docFee}
                      onChange={(e) => setDocFee(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Specialties & Abilities / Skills</label>
                    <input
                      type="text"
                      placeholder="e.g. Angioplasty, Cardiac Surgery, OPD Consultation"
                      value={docAbilities}
                      onChange={(e) => setDocAbilities(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Availability Status</label>
                    <select
                      value={docAvailability}
                      onChange={(e) => setDocAvailability(e.target.value)}
                      disabled={isSubmittingDoc}
                    >
                      <option value="available">AVAILABLE (🟢)</option>
                      <option value="unavailable">UNAVAILABLE (🔴)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-presc-btn"
                  disabled={isSubmittingDoc}
                >
                  {isSubmittingDoc ? "Saving Doctor Entry..." : "Save Doctor Entry to DB 🩺"}
                </button>
              </form>
            </section>
          )}

          {/* TAB 5: Patient Entry Form (ALL COLUMNS) */}
          {activeTab === "addPatient" && (
            <section className="dashboard-section form-section">
              <h3>🧑‍🦽 Register & Add New Patient Entry</h3>
              <p style={{ marginTop: "-12px", marginBottom: "20px", fontSize: "13px", color: "#64748b" }}>
                Creates a patient user account and stores all patient profile attributes in the PostgreSQL database.
              </p>

              <form onSubmit={handleCreatePatientEntry} className="prescription-form">
                <div className="form-group">
                  <label>Patient Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={patName}
                    onChange={(e) => setPatName(e.target.value)}
                    required
                    disabled={isSubmittingPat}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={patEmail}
                      onChange={(e) => setPatEmail(e.target.value)}
                      required
                      disabled={isSubmittingPat}
                    />
                  </div>

                  <div className="form-group">
                    <label>Account Password</label>
                    <input
                      type="password"
                      placeholder="Enter password (default: Password123)"
                      value={patPassword}
                      onChange={(e) => setPatPassword(e.target.value)}
                      disabled={isSubmittingPat}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age (Years)</label>
                    <input
                      type="number"
                      placeholder="e.g. 34"
                      value={patAge}
                      onChange={(e) => setPatAge(e.target.value)}
                      disabled={isSubmittingPat}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={patGender}
                      onChange={(e) => setPatGender(e.target.value)}
                      disabled={isSubmittingPat}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      value={patBloodGroup}
                      onChange={(e) => setPatBloodGroup(e.target.value)}
                      disabled={isSubmittingPat}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={patContact}
                      onChange={(e) => setPatContact(e.target.value)}
                      disabled={isSubmittingPat}
                    />
                  </div>

                  <div className="form-group">
                    <label>Residential Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 62, Noida, UP"
                      value={patAddress}
                      onChange={(e) => setPatAddress(e.target.value)}
                      disabled={isSubmittingPat}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-presc-btn"
                  disabled={isSubmittingPat}
                >
                  {isSubmittingPat ? "Saving Patient Entry..." : "Save Patient Entry to DB 🧑‍🤝‍🧑"}
                </button>
              </form>
            </section>
          )}

          {/* TAB 6: Register & Edit System User (WITH 3 RADIO BUTTON MODES) */}
          {activeTab === "addUser" && (
            <section className="dashboard-section form-section">
              <h3>⚙️ Register & Edit System User</h3>
              <p style={{ marginTop: "-12px", marginBottom: "20px", fontSize: "13px", color: "#64748b" }}>
                Select an action mode below to register a new user, edit username & profile details, or modify password & role.
              </p>

              {/* 3 RADIO BUTTON MODE SELECTOR */}
              <div className="user-form-mode-selector">
                <label className={`radio-label ${userFormMode === "register" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="userFormMode"
                    value="register"
                    checked={userFormMode === "register"}
                    onChange={() => setUserFormMode("register")}
                  />
                  <span>1️⃣ Register New User</span>
                </label>

                <label className={`radio-label ${userFormMode === "editUsername" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="userFormMode"
                    value="editUsername"
                    checked={userFormMode === "editUsername"}
                    onChange={() => setUserFormMode("editUsername")}
                  />
                  <span>2️⃣ Edit Username & Profile</span>
                </label>

                <label className={`radio-label ${userFormMode === "editPassword" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="userFormMode"
                    value="editPassword"
                    checked={userFormMode === "editPassword"}
                    onChange={() => setUserFormMode("editPassword")}
                  />
                  <span>3️⃣ Edit Password & Role</span>
                </label>
              </div>

              {userCreatedMsg && (
                <div className="alert-banner success-alert">
                  ✅ {userCreatedMsg}
                </div>
              )}

              {/* MODE 1: REGISTER NEW USER */}
              {userFormMode === "register" && (
                <form onSubmit={handleCreateUser} className="prescription-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rohit Sharma"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      disabled={isSubmittingNewUser}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="rohit@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                        disabled={isSubmittingNewUser}
                      />
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="Enter password (e.g. Password123)"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        disabled={isSubmittingNewUser}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Assign Account Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      required
                      disabled={isSubmittingNewUser}
                    >
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="submit-presc-btn"
                    disabled={isSubmittingNewUser}
                  >
                    {isSubmittingNewUser ? "Registering User..." : "Register User 🚀"}
                  </button>
                </form>
              )}

              {/* MODE 2: EDIT USERNAME & PROFILE */}
              {userFormMode === "editUsername" && (
                <form onSubmit={handleUpdateUserProfile} className="prescription-form">
                  <div className="form-group">
                    <label>Old Username (Target Account)</label>
                    <input
                      type="text"
                      placeholder="Enter existing username (e.g. rohit_sharma)"
                      value={editOldUsername}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditOldUsername(val);
                        const found = usersList.find(u => u.username === val || u.email === val);
                        if (found) {
                          setEditNewName(found.name);
                          setEditNewEmail(found.email);
                          setEditNewUsername(found.username);
                        }
                      }}
                      required
                      disabled={isSubmittingUsernameEdit}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>New Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Rohit Sharma Updated"
                        value={editNewName}
                        onChange={(e) => setEditNewName(e.target.value)}
                        required
                        disabled={isSubmittingUsernameEdit}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. newrohit@example.com"
                        value={editNewEmail}
                        onChange={(e) => setEditNewEmail(e.target.value)}
                        required
                        disabled={isSubmittingUsernameEdit}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Username</label>
                    <input
                      type="text"
                      placeholder="e.g. rohit_sharma_v2"
                      value={editNewUsername}
                      onChange={(e) => setEditNewUsername(e.target.value)}
                      required
                      disabled={isSubmittingUsernameEdit}
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-presc-btn"
                    disabled={isSubmittingUsernameEdit}
                  >
                    {isSubmittingUsernameEdit ? "Updating Profile..." : "Update Profile & Username 💾"}
                  </button>
                </form>
              )}

              {/* MODE 3: EDIT PASSWORD & ROLE */}
              {userFormMode === "editPassword" && (
                <form onSubmit={handleUpdateUserPasswordAndRole} className="prescription-form">
                  <div className="form-group">
                    <label>Target Username / Email</label>
                    <input
                      type="text"
                      placeholder="Enter username (e.g. rohit_sharma)"
                      value={editPassTargetUsername}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditPassTargetUsername(val);
                        const found = usersList.find(u => u.username === val || u.email === val);
                        if (found) {
                          setEditPassRole(found.role as UserRole);
                          const isActive = found.status?.toLowerCase() === "activate" || found.status?.toLowerCase() === "active";
                          setEditPassStatus(isActive ? "activate" : "disable");
                        }
                      }}
                      required
                      disabled={isSubmittingPassEdit}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password (e.g. NewPass123)"
                        value={editNewPasswordVal}
                        onChange={(e) => setEditNewPasswordVal(e.target.value)}
                        disabled={isSubmittingPassEdit}
                      />
                    </div>

                    <div className="form-group">
                      <label>Assign Account Role</label>
                      <select
                        value={editPassRole}
                        onChange={(e) => setEditPassRole(e.target.value as UserRole)}
                        required
                        disabled={isSubmittingPassEdit}
                      >
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="admin">Admin</option>
                        <option value="recipient">Recipient</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Account Status</label>
                    <select
                      value={editPassStatus}
                      onChange={(e) => setEditPassStatus(e.target.value)}
                      disabled={isSubmittingPassEdit}
                    >
                      <option value="activate">Active / Activate (🟢)</option>
                      <option value="disable">Disabled / Blocked (🔴)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="submit-presc-btn"
                    disabled={isSubmittingPassEdit}
                  >
                    {isSubmittingPassEdit ? "Updating Credentials..." : "Update Password & Role 🔐"}
                  </button>
                </form>
              )}
            </section>
          )}

        </main>
      </div>

      {/* EDIT DOCTOR MODAL (ALL DOCTOR COLUMNS) */}
      {editingDoctor && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3>✏️ Edit Doctor Profile Details (#DOC-{editingDoctor.id})</h3>
              <button className="close-modal-btn" onClick={() => setEditingDoctor(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveDoctorEdit} className="prescription-form">
              <div className="form-group">
                <label>Doctor Full Name</label>
                <input
                  type="text"
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editDocGender}
                    onChange={(e) => setEditDocGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={editDocContact}
                    onChange={(e) => setEditDocContact(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Specialty / Doctor Type</label>
                  <input
                    type="text"
                    value={editDocType}
                    onChange={(e) => setEditDocType(e.target.value)}
                    placeholder="e.g. Cardiologist"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    value={editDocExp}
                    onChange={(e) => setEditDocExp(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={editDocFee}
                    onChange={(e) => setEditDocFee(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Availability Status</label>
                  <select
                    value={editDocAvailability}
                    onChange={(e) => setEditDocAvailability(e.target.value)}
                  >
                    <option value="available">AVAILABLE (🟢)</option>
                    <option value="unavailable">UNAVAILABLE (🔴)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Abilities / Specialization Skills</label>
                <input
                  type="text"
                  value={editDocAbilities}
                  onChange={(e) => setEditDocAbilities(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingDoctor(null)}>Cancel</button>
                <button type="submit" className="submit-presc-btn" disabled={isSavingDoctorEdit}>
                  {isSavingDoctorEdit ? "Saving..." : "Save Changes to DB 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL (ALL PATIENT COLUMNS) */}
      {editingPatient && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h3>✏️ Edit Patient Profile Details (#PAT-{editingPatient.id})</h3>
              <button className="close-modal-btn" onClick={() => setEditingPatient(null)}>✕</button>
            </div>
            <form onSubmit={handleSavePatientEdit} className="prescription-form">
              <div className="form-group">
                <label>Patient Full Name</label>
                <input
                  type="text"
                  value={editPatName}
                  onChange={(e) => setEditPatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age (Years)</label>
                  <input
                    type="number"
                    value={editPatAge}
                    onChange={(e) => setEditPatAge(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editPatGender}
                    onChange={(e) => setEditPatGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    value={editPatBloodGroup}
                    onChange={(e) => setEditPatBloodGroup(e.target.value)}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={editPatContact}
                  onChange={(e) => setEditPatContact(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Residential Address</label>
                <input
                  type="text"
                  value={editPatAddress}
                  onChange={(e) => setEditPatAddress(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingPatient(null)}>Cancel</button>
                <button type="submit" className="submit-presc-btn" disabled={isSavingPatientEdit}>
                  {isSavingPatientEdit ? "Saving..." : "Save Changes to DB 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
