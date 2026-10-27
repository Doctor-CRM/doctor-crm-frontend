import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { adminService } from "../service/adminService";
import { authService } from "../service/authService";
import { getApiErrorMessage } from "../service/api";
import { getEffectiveUsername } from "../utils/roleUtils";
import "./AdminDashboard.css";
import type { UserRole } from "../types/auth";
import type {
  AdminUser,
  SummaryMetrics,
  DoctorProfile,
  PatientProfile,
  RoleUser,
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
  const { user, logout, updateUsername } = useAuthStore();
  const effectiveUsername = getEffectiveUsername(user);

  // Tab State: "doctors" | "patients" | "receptionists" | "changeUsername" | "users" | "addDoctor" | "addPatient" | "addUser"
  const [activeTab, setActiveTab] = useState<
    | "users"
    | "doctors"
    | "patients"
    | "receptionists"
    | "changeUsername"
    | "addDoctor"
    | "addPatient"
    | "addUser"
  >("users");

  // Sub-view toggles for Doctors and Patients tabs
  const [doctorViewMode, setDoctorViewMode] = useState<"users" | "profiles">("users");
  const [patientViewMode, setPatientViewMode] = useState<"users" | "profiles">("users");

  // Pure API Data States
  const [summary, setSummary] = useState<SummaryMetrics>(INITIAL_SUMMARY);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);

  // 1. Doctors from GET /api/v1/users/doctors
  const [doctorsUsersList, setDoctorsUsersList] = useState<RoleUser[]>([]);
  const [isLoadingDoctorsUsers, setIsLoadingDoctorsUsers] = useState<boolean>(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>("");

  // 2. Patients from GET /api/v1/users/patients
  const [patientsUsersList, setPatientsUsersList] = useState<RoleUser[]>([]);
  const [isLoadingPatientsUsers, setIsLoadingPatientsUsers] = useState<boolean>(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>("");

  // 3. Receptionists from GET /api/v1/users/receptionists
  const [receptionistsList, setReceptionistsList] = useState<RoleUser[]>([]);
  const [isLoadingReceptionists, setIsLoadingReceptionists] = useState<boolean>(false);
  const [receptionistSearchQuery, setReceptionistSearchQuery] = useState<string>("");

  // Clinical profile data lists
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [patientsList, setPatientsList] = useState<PatientProfile[]>([]);
  const [isLoadingDoctorProfiles, setIsLoadingDoctorProfiles] = useState<boolean>(false);
  const [isLoadingPatientProfiles, setIsLoadingPatientProfiles] = useState<boolean>(false);

  // Status & Feedback States
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">("checking");
  const [dbHealthStatus, setDbHealthStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | number | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Filter States for All Users table
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mode state for Tab "addUser": "register" | "editUsername" | "editPassword"
  const [userFormMode, setUserFormMode] = useState<"register" | "editUsername" | "editPassword">("register");

  // Generic New User Signup State (Mode 1 in addUser)
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("doctor");
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const [userCreatedMsg, setUserCreatedMsg] = useState("");

  // Mode 2 in addUser: Edit Username & Profile State
  const [editOldUsername, setEditOldUsername] = useState("");
  const [editNewName, setEditNewName] = useState("");
  const [editNewEmail, setEditNewEmail] = useState("");
  const [editNewUsername, setEditNewUsername] = useState("");
  const [isSubmittingUsernameEdit, setIsSubmittingUsernameEdit] = useState(false);

  // Mode 3 in addUser: Edit Password & Role State
  const [editPassTargetUsername, setEditPassTargetUsername] = useState("");
  const [editNewPasswordVal, setEditNewPasswordVal] = useState("");
  const [editPassRole, setEditPassRole] = useState<UserRole | string>("doctor");
  const [editPassStatus, setEditPassStatus] = useState("activate");
  const [isSubmittingPassEdit, setIsSubmittingPassEdit] = useState(false);

  // 4. Change Username Dedicated Tab State (POST /api/v1/users/changeusername)
  const [changeUserTargetUsername, setChangeUserTargetUsername] = useState<string>("");
  const [changeUserNewUsername, setChangeUserNewUsername] = useState<string>("");
  const [isSubmittingChangeUserTab, setIsSubmittingChangeUserTab] = useState<boolean>(false);

  // 5. Change Username Quick Modal State
  const [usernameModalOpen, setUsernameModalOpen] = useState<boolean>(false);
  const [modalOldUsername, setModalOldUsername] = useState<string>("");
  const [modalNewUsername, setModalNewUsername] = useState<string>("");
  const [modalTargetName, setModalTargetName] = useState<string>("");
  const [isSubmittingModalUsername, setIsSubmittingModalUsername] = useState<boolean>(false);

  // --- DOCTOR ENTRY FORM STATE ---
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

  // --- PATIENT ENTRY FORM STATE ---
  const [patName, setPatName] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patPassword, setPatPassword] = useState("");
  const [patAge, setPatAge] = useState<number | string>(25);
  const [patGender, setPatGender] = useState("Male");
  const [patBloodGroup, setPatBloodGroup] = useState("O+");
  const [patContact, setPatContact] = useState("");
  const [patAddress, setPatAddress] = useState("");
  const [isSubmittingPat, setIsSubmittingPat] = useState(false);

  // --- EDIT DOCTOR PROFILE MODAL STATE ---
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

  // --- EDIT PATIENT PROFILE MODAL STATE ---
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
    }, 4500);
  };

  // Fetch Backend & DB Health Status (GET /api/v1/health)
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await adminService.checkHealth();
      setHealthStatus("online");
      const isDbConnected = res.db_status === "connected" || !res.db_status;
      setDbHealthStatus(isDbConnected ? "connected" : "disconnected");
    } catch {
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
      showToast(`Failed to load users: ${errMsg}`, "error");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // 1. Fetch All Doctors (GET /api/v1/users/doctors)
  const fetchAllDoctors = useCallback(async () => {
    setIsLoadingDoctorsUsers(true);
    try {
      const doctors = await adminService.getAllDoctors();
      setDoctorsUsersList(doctors || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load doctors: ${errMsg}`, "error");
    } finally {
      setIsLoadingDoctorsUsers(false);
    }
  }, []);

  // 2. Fetch All Patients (GET /api/v1/users/patients)
  const fetchAllPatients = useCallback(async () => {
    setIsLoadingPatientsUsers(true);
    try {
      const patients = await adminService.getAllPatients();
      setPatientsUsersList(patients || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load patients: ${errMsg}`, "error");
    } finally {
      setIsLoadingPatientsUsers(false);
    }
  }, []);

  // 3. Fetch All Receptionists (GET /api/v1/users/receptionists)
  const fetchAllReceptionists = useCallback(async () => {
    setIsLoadingReceptionists(true);
    try {
      const receptionists = await adminService.getAllReceptionists();
      setReceptionistsList(receptionists || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load receptionists: ${errMsg}`, "error");
    } finally {
      setIsLoadingReceptionists(false);
    }
  }, []);

  // Fetch Doctor Profiles (GET /api/v1/doctor/data)
  const fetchDoctorProfiles = useCallback(async () => {
    setIsLoadingDoctorProfiles(true);
    try {
      const doctors = await adminService.getDoctorData();
      setDoctorsList(doctors || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load doctor profiles: ${errMsg}`, "error");
    } finally {
      setIsLoadingDoctorProfiles(false);
    }
  }, []);

  // Fetch Patient Profiles (GET /api/v1/patient/data)
  const fetchPatientProfiles = useCallback(async () => {
    setIsLoadingPatientProfiles(true);
    try {
      const patients = await adminService.getPatientData();
      setPatientsList(patients || []);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to load patient profiles: ${errMsg}`, "error");
    } finally {
      setIsLoadingPatientProfiles(false);
    }
  }, []);

  // Manual Refresh Handler
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        checkBackendHealth(),
        fetchUsersAndSummary(),
        fetchAllDoctors(),
        fetchAllPatients(),
        fetchAllReceptionists(),
        fetchDoctorProfiles(),
        fetchPatientProfiles(),
      ]);
      const timeStr = new Date().toLocaleTimeString();
      setLastSyncedTime(timeStr);
      showToast(`Data refreshed from Database at ${timeStr}! 🔄`, "success");
    } catch (err) {
      showToast(`Refresh failed: ${getApiErrorMessage(err)}`, "error");
    } finally {
      setIsRefreshing(false);
    }
  }, [
    checkBackendHealth,
    fetchUsersAndSummary,
    fetchAllDoctors,
    fetchAllPatients,
    fetchAllReceptionists,
    fetchDoctorProfiles,
    fetchPatientProfiles,
  ]);

  // Initial load
  useEffect(() => {
    checkBackendHealth();
    fetchUsersAndSummary();
    fetchAllDoctors();
    fetchAllPatients();
    fetchAllReceptionists();
    fetchDoctorProfiles();
    fetchPatientProfiles();
    const initTime = new Date().toLocaleTimeString();
    setLastSyncedTime(initTime);
  }, [
    checkBackendHealth,
    fetchUsersAndSummary,
    fetchAllDoctors,
    fetchAllPatients,
    fetchAllReceptionists,
    fetchDoctorProfiles,
    fetchPatientProfiles,
  ]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Open Quick Change Username Modal
  const handleOpenChangeUsernameModal = (targetUsername?: string, targetName?: string) => {
    setModalOldUsername(targetUsername || "");
    setModalNewUsername("");
    setModalTargetName(targetName || targetUsername || "User");
    setUsernameModalOpen(true);
  };

  // 4. Submit Change Username from Quick Modal (POST /api/v1/users/changeusername)
  const handleModalChangeUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldU = modalOldUsername.trim();
    const newU = modalNewUsername.trim();

    if (!oldU || !newU) {
      showToast("Both current and new username are required.", "error");
      return;
    }
    if (oldU === newU) {
      showToast("New username must be different from current username.", "error");
      return;
    }

    setIsSubmittingModalUsername(true);
    try {
      const res = await adminService.changeUsername({
        username: oldU,
        new_username: newU,
      });

      const successMsg = res?.message || `Username for "${oldU}" successfully changed to "${newU}"!`;
      showToast(successMsg, "success");
      setUsernameModalOpen(false);

      if (oldU.toLowerCase() === effectiveUsername.toLowerCase()) {
        updateUsername(newU);
      }

      // Refresh all lists
      await Promise.allSettled([
        fetchUsersAndSummary(),
        fetchAllDoctors(),
        fetchAllPatients(),
        fetchAllReceptionists(),
      ]);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Failed to update username: ${errMsg}`, "error");
    } finally {
      setIsSubmittingModalUsername(false);
    }
  };

  // 4. Submit Change Username from Dedicated Tab (POST /api/v1/users/changeusername)
  const handleChangeUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldUsername = changeUserTargetUsername.trim();
    const newUsername = changeUserNewUsername.trim();

    if (!oldUsername) {
      showToast("Please enter or select the current username.", "error");
      return;
    }
    if (!newUsername) {
      showToast("Please enter the new username.", "error");
      return;
    }
    if (oldUsername === newUsername) {
      showToast("New username must be different from the old username.", "error");
      return;
    }

    setIsSubmittingChangeUserTab(true);
    try {
      const res = await adminService.changeUsername({
        username: oldUsername,
        new_username: newUsername,
      });

      const successMsg = res?.message || `Username successfully changed from "${oldUsername}" to "${newUsername}"!`;
      showToast(successMsg, "success");

      if (oldUsername.toLowerCase() === effectiveUsername.toLowerCase()) {
        updateUsername(newUsername);
      }

      setChangeUserTargetUsername("");
      setChangeUserNewUsername("");

      // Refetch all lists
      await Promise.allSettled([
        fetchUsersAndSummary(),
        fetchAllDoctors(),
        fetchAllPatients(),
        fetchAllReceptionists(),
      ]);
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Change username failed: ${errMsg}`, "error");
    } finally {
      setIsSubmittingChangeUserTab(false);
    }
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

  // Mode 2 in addUser: Update Username & Profile Details (POST /api/v1/users/changeusername)
  const handleUpdateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldU = editOldUsername.trim();
    const newU = editNewUsername.trim();
    if (!oldU) return;

    setIsSubmittingUsernameEdit(true);
    try {
      if (newU && newU !== oldU) {
        await adminService.changeUsername({
          username: oldU,
          new_username: newU,
        });
      }

      const existingUser = usersList.find(
        (u) => u.username === oldU || u.email === oldU
      );

      if (editNewName || editNewEmail) {
        await adminService.updateUser({
          username: newU || oldU,
          name: editNewName || existingUser?.name || oldU,
          email: editNewEmail || existingUser?.email || `${oldU}@hospital.com`,
          role: existingUser?.role ? String(existingUser.role) : "doctor",
          status: existingUser?.status || "activate",
          action: existingUser?.action || "activate",
        });
      }

      const successMsg = `Username for "${oldU}" updated successfully in Database! 💾`;
      showToast(successMsg, "success");

      await Promise.allSettled([
        fetchUsersAndSummary(),
        fetchAllDoctors(),
        fetchAllPatients(),
        fetchAllReceptionists(),
      ]);

      setEditOldUsername("");
      setEditNewName("");
      setEditNewEmail("");
      setEditNewUsername("");
      setActiveTab("users");
    } catch (error) {
      const errMsg = getApiErrorMessage(error);
      showToast(`Username update failed: ${errMsg}`, "error");
    } finally {
      setIsSubmittingUsernameEdit(false);
    }
  };

  // Mode 3 in addUser: Update Password & Role Details (POST /api/v1/user/update)
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

  // --- HANDLER: CREATE DOCTOR ENTRY ---
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
      await fetchAllDoctors();
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

  // --- HANDLER: CREATE PATIENT ENTRY ---
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
      await fetchAllPatients();
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

  // Filtered Users
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

  // Filtered Doctor Users (GET /api/v1/users/doctors)
  const filteredDoctorUsers = doctorsUsersList.filter((doc) => {
    if (!doctorSearchQuery.trim()) return true;
    const q = doctorSearchQuery.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(q) ||
      doc.username?.toLowerCase().includes(q) ||
      doc.email?.toLowerCase().includes(q) ||
      String(doc.id).includes(q)
    );
  });

  // Filtered Patient Users (GET /api/v1/users/patients)
  const filteredPatientUsers = patientsUsersList.filter((pat) => {
    if (!patientSearchQuery.trim()) return true;
    const q = patientSearchQuery.toLowerCase();
    return (
      pat.name?.toLowerCase().includes(q) ||
      pat.username?.toLowerCase().includes(q) ||
      pat.email?.toLowerCase().includes(q) ||
      String(pat.id).includes(q)
    );
  });

  // Filtered Receptionists (GET /api/v1/users/receptionists)
  const filteredReceptionists = receptionistsList.filter((rec) => {
    if (!receptionistSearchQuery.trim()) return true;
    const q = receptionistSearchQuery.toLowerCase();
    return (
      rec.name?.toLowerCase().includes(q) ||
      rec.username?.toLowerCase().includes(q) ||
      rec.email?.toLowerCase().includes(q) ||
      String(rec.id).includes(q)
    );
  });

  // Filtered Doctor Profiles
  const filteredDoctorProfiles = doctorsList.filter((d) => {
    const q = doctorSearchQuery.toLowerCase();
    return (
      d.doctor_name.toLowerCase().includes(q) ||
      d.doctor_type.toLowerCase().includes(q) ||
      (d.contact_number && d.contact_number.includes(q)) ||
      d.doctor_abilities.toLowerCase().includes(q)
    );
  });

  // Filtered Patient Profiles
  const filteredPatientProfiles = patientsList.filter((p) => {
    const q = patientSearchQuery.toLowerCase();
    return (
      p.patient_name.toLowerCase().includes(q) ||
      p.contact_number.includes(q) ||
      p.blood_group.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  });

  // Combined unique users for easy username selection
  const allKnownUsers = Array.from(
    new Map(
      [...usersList, ...doctorsUsersList, ...patientsUsersList, ...receptionistsList]
        .filter((u) => u && u.username)
        .map((u) => [u.username, u])
    ).values()
  );

  return (
    <div className="dashboard-layout admin-theme">
      {/* Top Navigation Bar */}
      <header className="dashboard-header">
        <div className="brand-badge-container">
          <img
            src={logoImg}
            alt="Hospital CRM Logo"
            style={{ height: "36px", width: "auto", objectFit: "contain", borderRadius: "6px" }}
          />
          <div className="brand-badge admin-badge">🛡️ Admin Console</div>
        </div>

        <div className="user-profile-section">
          {/* Health Status Indicator */}
          <div className="system-health-badge">
            <span
              className={`health-dot ${healthStatus === "online" ? "online" : "offline"}`}
            />
            <span>
              Server: <strong>{healthStatus === "online" ? "Online" : "Offline"}</strong>
            </span>
            <span style={{ margin: "0 4px", color: "#94a3b8" }}>|</span>
            <span>
              DB: <strong>{dbHealthStatus === "connected" ? "Connected 🟢" : "Disconnected 🔴"}</strong>
              {lastSyncedTime && (
                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }}>
                  ({lastSyncedTime})
                </span>
              )}
            </span>
          </div>

          {/* Quick Header Change Username Button */}
          <button
            onClick={() => handleOpenChangeUsernameModal("")}
            className="header-change-user-btn"
            title="Change Username"
          >
            ✏️ Change Username
          </button>

          <button
            onClick={handleManualRefresh}
            className="refresh-api-btn"
            disabled={isRefreshing}
            title="Refetch all data from Database"
          >
            {isRefreshing ? "Syncing..." : "🔄 Refresh"}
          </button>

          <div className="logged-in-profile-badge">
            <div className="profile-badge-avatar admin">
              {effectiveUsername ? effectiveUsername.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="profile-badge-text">
              <span className="profile-badge-label">Logged In</span>
              <span className="profile-badge-username">@{effectiveUsername || "admin"}</span>
            </div>
            <span className="profile-badge-role admin">Admin</span>
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
              👥 All System Users
            </button>

            <button
              className={`menu-item ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("doctors");
                if (doctorsUsersList.length === 0) fetchAllDoctors();
              }}
            >
              👨‍⚕️ Doctors ({doctorsUsersList.length})
            </button>

            <button
              className={`menu-item ${activeTab === "patients" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("patients");
                if (patientsUsersList.length === 0) fetchAllPatients();
              }}
            >
              🧑‍🤝‍🧑 Patients ({patientsUsersList.length})
            </button>

            <button
              className={`menu-item ${activeTab === "receptionists" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("receptionists");
                if (receptionistsList.length === 0) fetchAllReceptionists();
              }}
            >
              🏨 Receptionists ({receptionistsList.length})
            </button>

            <button
              className={`menu-item ${activeTab === "changeUsername" ? "active" : ""}`}
              onClick={() => setActiveTab("changeUsername")}
            >
              ✏️ Change Username
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
              ➕ Register & Edit User
            </button>
          </nav>

          <div className="quick-stats-box">
            <h4>Detail</h4>
            <div className="stat-mini">
              <span>Total DB Users:</span>
              <strong>{summary.total_users || usersList.length}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Doctors:</span>
              <strong>{doctorsUsersList.length || summary.total_doctors}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Patients:</span>
              <strong>{patientsUsersList.length || summary.total_patients}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Receptionists:</span>
              <strong>{receptionistsList.length || summary.total_recipients || 0}</strong>
            </div>
            <div className="stat-mini">
              <span>Total Admins:</span>
              <strong>{summary.total_admins}</strong>
            </div>
            <div className="stat-mini">
              <span>Server Status:</span>
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

          <div className="sidebar-user-footer">
            <div className="sidebar-user-avatar admin">
              {effectiveUsername ? effectiveUsername.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-label">Active Admin</span>
              <span className="sidebar-user-username">@{effectiveUsername || "admin"}</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          {/* Quick Actions Bar (Top Pill Tabs for Quick Mobile & Desktop Switching) */}
          <div className="quick-actions-bar">
            <button
              className={`quick-action-pill ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              👥 All Users <span className="pill-badge">{summary.total_users || usersList.length}</span>
            </button>

            <button
              className={`quick-action-pill ${activeTab === "doctors" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("doctors");
                if (doctorsUsersList.length === 0) fetchAllDoctors();
              }}
            >
              👨‍⚕️ Doctors <span className="pill-badge">{doctorsUsersList.length}</span>
            </button>

            <button
              className={`quick-action-pill ${activeTab === "patients" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("patients");
                if (patientsUsersList.length === 0) fetchAllPatients();
              }}
            >
              🧑‍🤝‍🧑 Patients <span className="pill-badge">{patientsUsersList.length}</span>
            </button>

            <button
              className={`quick-action-pill ${activeTab === "receptionists" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("receptionists");
                if (receptionistsList.length === 0) fetchAllReceptionists();
              }}
            >
              🏨 Receptionists <span className="pill-badge">{receptionistsList.length}</span>
            </button>

            <button
              className={`quick-action-pill ${activeTab === "changeUsername" ? "active" : ""}`}
              onClick={() => setActiveTab("changeUsername")}
            >
              ✏️ Change Username
            </button>
          </div>

          {/* Toast Notification Alert */}
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
                <h3>{doctorsUsersList.length || summary.total_doctors}</h3>
                <p>Total Doctors</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">🧑‍🤝‍🧑</div>
              <div className="stat-content">
                <h3>{patientsUsersList.length || summary.total_patients}</h3>
                <p>Total Patients</p>
              </div>
            </div>

            <div className="stat-card pink">
              <div className="stat-icon">🏨</div>
              <div className="stat-content">
                <h3>{receptionistsList.length || summary.total_recipients || 0}</h3>
                <p>Total Receptionists</p>
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
                <h3>{summary.total_users || usersList.length}</h3>
                <p>Total Registered Users</p>
              </div>
            </div>
          </div>

          {/* TAB 1: All System Users Management */}
          {activeTab === "users" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>System Users Management</h3>
                  <div className="tab-account-badge" style={{ marginBottom: "6px" }}>
                    🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Change user roles directly via dropdown, toggle active/disabled status, or update username.
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
                  Loading system users...
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
                        <th>Role</th>
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

                              <td>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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

                                  <button
                                    className="btn-change-username"
                                    onClick={() => handleOpenChangeUsernameModal(u.username, u.name)}
                                    title="Change Username"
                                  >
                                    ✏️ Username
                                  </button>
                                </div>
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

          {/* TAB 2: Doctors Directory (GET /api/v1/users/doctors) */}
          {activeTab === "doctors" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>👨‍⚕️ Doctors Management</h3>
                  <div className="tab-account-badge" style={{ marginBottom: "6px" }}>
                    🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Manage registered hospital doctors and clinical profiles.
                  </p>
                </div>

                <div className="filter-controls">
                  <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                    <button
                      className={`action-btn ${doctorViewMode === "users" ? "btn-activate" : ""}`}
                      style={{ padding: "6px 12px", fontSize: "12px", background: doctorViewMode === "users" ? "#2563eb" : "transparent", color: doctorViewMode === "users" ? "#fff" : "#475569" }}
                      onClick={() => setDoctorViewMode("users")}
                    >
                      Doctors List ({doctorsUsersList.length})
                    </button>
                    <button
                      className={`action-btn ${doctorViewMode === "profiles" ? "btn-activate" : ""}`}
                      style={{ padding: "6px 12px", fontSize: "12px", background: doctorViewMode === "profiles" ? "#2563eb" : "transparent", color: doctorViewMode === "profiles" ? "#fff" : "#475569" }}
                      onClick={() => {
                        setDoctorViewMode("profiles");
                        if (doctorsList.length === 0) fetchDoctorProfiles();
                      }}
                    >
                      Clinical Profiles ({doctorsList.length})
                    </button>
                  </div>

                  <button
                    className="submit-presc-btn"
                    onClick={() => setActiveTab("addDoctor")}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    + Add Doctor Entry
                  </button>

                  <input
                    type="text"
                    placeholder="Search doctor by name, username, email..."
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                    className="table-search-input"
                    style={{ width: "260px" }}
                  />
                </div>
              </div>

              {doctorViewMode === "users" ? (
                isLoadingDoctorsUsers ? (
                  <div className="table-loading-container">
                    Loading doctors directory...
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Doctor Name</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctorUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="empty-state">
                              No doctors found in directory.
                            </td>
                          </tr>
                        ) : (
                          filteredDoctorUsers.map((doc) => (
                            <tr key={doc.id}>
                              <td><strong>#{doc.id}</strong></td>
                              <td><strong>{doc.name}</strong></td>
                              <td><code>{doc.username}</code></td>
                              <td>{doc.email}</td>
                              <td>
                                <span className="pill-tag role-doctor">
                                  {doc.role?.toUpperCase() || "DOCTOR"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    className="btn-change-username"
                                    onClick={() => handleOpenChangeUsernameModal(doc.username, doc.name)}
                                    title="Change Username"
                                  >
                                    ✏️ Change Username
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                isLoadingDoctorProfiles ? (
                  <div className="table-loading-container">
                    Loading doctor profiles...
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
                          <th>Contact</th>
                          <th>Specialty</th>
                          <th>Experience</th>
                          <th>Fee</th>
                          <th>Availability</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctorProfiles.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="empty-state">
                              No clinical doctor profiles found in Database.
                            </td>
                          </tr>
                        ) : (
                          filteredDoctorProfiles.map((doc) => (
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
                                  title="Edit Clinical Details"
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
                )
              )}
            </section>
          )}

          {/* TAB 2: Patients Directory (GET /api/v1/users/patients) */}
          {activeTab === "patients" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>🧑‍🤝‍🧑 Patients Management</h3>
                  <div className="tab-account-badge" style={{ marginBottom: "6px" }}>
                    🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Manage registered hospital patients and medical profiles.
                  </p>
                </div>

                <div className="filter-controls">
                  <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                    <button
                      className={`action-btn ${patientViewMode === "users" ? "btn-activate" : ""}`}
                      style={{ padding: "6px 12px", fontSize: "12px", background: patientViewMode === "users" ? "#2563eb" : "transparent", color: patientViewMode === "users" ? "#fff" : "#475569" }}
                      onClick={() => setPatientViewMode("users")}
                    >
                      Patients List ({patientsUsersList.length})
                    </button>
                    <button
                      className={`action-btn ${patientViewMode === "profiles" ? "btn-activate" : ""}`}
                      style={{ padding: "6px 12px", fontSize: "12px", background: patientViewMode === "profiles" ? "#2563eb" : "transparent", color: patientViewMode === "profiles" ? "#fff" : "#475569" }}
                      onClick={() => {
                        setPatientViewMode("profiles");
                        if (patientsList.length === 0) fetchPatientProfiles();
                      }}
                    >
                      Clinical Profiles ({patientsList.length})
                    </button>
                  </div>

                  <button
                    className="submit-presc-btn"
                    onClick={() => setActiveTab("addPatient")}
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    + Add Patient Entry
                  </button>

                  <input
                    type="text"
                    placeholder="Search patient by name, username, email..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="table-search-input"
                    style={{ width: "260px" }}
                  />
                </div>
              </div>

              {patientViewMode === "users" ? (
                isLoadingPatientsUsers ? (
                  <div className="table-loading-container">
                    Loading patients directory...
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Patient Name</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatientUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="empty-state">
                              No patients found in directory.
                            </td>
                          </tr>
                        ) : (
                          filteredPatientUsers.map((pat) => (
                            <tr key={pat.id}>
                              <td><strong>#{pat.id}</strong></td>
                              <td><strong>{pat.name}</strong></td>
                              <td><code>{pat.username}</code></td>
                              <td>{pat.email}</td>
                              <td>
                                <span className="pill-tag role-patient">
                                  {pat.role?.toUpperCase() || "PATIENT"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    className="btn-change-username"
                                    onClick={() => handleOpenChangeUsernameModal(pat.username, pat.name)}
                                    title="Change Username"
                                  >
                                    ✏️ Change Username
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                isLoadingPatientProfiles ? (
                  <div className="table-loading-container">
                    Loading patient profiles...
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Pat ID</th>
                          <th>User ID</th>
                          <th>Patient Name</th>
                          <th>Age</th>
                          <th>Gender</th>
                          <th>Blood Group</th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatientProfiles.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="empty-state">
                              No patient clinical profiles found in Database.
                            </td>
                          </tr>
                        ) : (
                          filteredPatientProfiles.map((pat) => (
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
                                  title="Edit Clinical Details"
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
                )
              )}
            </section>
          )}

          {/* TAB 3: Receptionists Directory (GET /api/v1/users/receptionists) */}
          {activeTab === "receptionists" && (
            <section className="dashboard-section">
              <div className="section-header">
                <div>
                  <h3>🏨 Receptionists Directory</h3>
                  <div className="tab-account-badge" style={{ marginBottom: "6px" }}>
                    🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Directory of hospital front desk and receptionist staff.
                  </p>
                </div>

                <div className="filter-controls">
                  <input
                    type="text"
                    placeholder="Search receptionist by name, username, email..."
                    value={receptionistSearchQuery}
                    onChange={(e) => setReceptionistSearchQuery(e.target.value)}
                    className="table-search-input"
                    style={{ width: "280px" }}
                  />
                </div>
              </div>

              {isLoadingReceptionists ? (
                <div className="table-loading-container">
                  Loading receptionists directory...
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Staff Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceptionists.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            No receptionists found in directory.
                          </td>
                        </tr>
                      ) : (
                        filteredReceptionists.map((rec) => (
                          <tr key={rec.id}>
                            <td><strong>#{rec.id}</strong></td>
                            <td><strong>{rec.name}</strong></td>
                            <td><code>{rec.username}</code></td>
                            <td>{rec.email}</td>
                            <td>
                              <span className="pill-tag role-receptionist">
                                {rec.role?.toUpperCase() || "RECEPTIONIST"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  className="btn-change-username"
                                  onClick={() => handleOpenChangeUsernameModal(rec.username, rec.name)}
                                  title="Change Username"
                                >
                                  ✏️ Change Username
                                </button>
                              </div>
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

          {/* TAB 4: Change Username (POST /api/v1/users/changeusername) */}
          {activeTab === "changeUsername" && (
            <section className="dashboard-section form-section">
              <div style={{ maxWidth: "640px" }}>
                <h3>✏️ Change Username</h3>
                <div className="tab-account-badge" style={{ marginBottom: "12px" }}>
                  🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
                </div>
                <p style={{ fontSize: "14px", color: "#64748b", marginTop: "-4px", marginBottom: "22px" }}>
                  Update the login username for any Doctor, Patient, Receptionist, or Administrator account.
                </p>

                <div className="change-username-card">
                  <form onSubmit={handleChangeUsernameSubmit} className="prescription-form">
                    <div className="form-group">
                      <label>Select User or Enter Current Username</label>
                      <select
                        value={changeUserTargetUsername}
                        onChange={(e) => setChangeUserTargetUsername(e.target.value)}
                        disabled={isSubmittingChangeUserTab}
                        style={{ marginBottom: "10px" }}
                      >
                        <option value="">-- Choose Existing User from System --</option>
                        {allKnownUsers.map((u) => (
                          <option key={String(u.id) + u.username} value={u.username}>
                            {u.name ? `${u.name} (${u.username}) [${String(u.role).toUpperCase()}]` : u.username}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Or type current username (e.g. doctor123)"
                        value={changeUserTargetUsername}
                        onChange={(e) => setChangeUserTargetUsername(e.target.value)}
                        required
                        disabled={isSubmittingChangeUserTab}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Username</label>
                      <input
                        type="text"
                        placeholder="Enter new desired username (e.g. dr_rahul_123)"
                        value={changeUserNewUsername}
                        onChange={(e) => setChangeUserNewUsername(e.target.value)}
                        required
                        disabled={isSubmittingChangeUserTab}
                      />
                      <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                        The target user will use this new username on their next login attempt.
                      </small>
                    </div>

                    {changeUserTargetUsername && changeUserNewUsername && (
                      <div className="username-preview-box">
                        <span>Preview:</span>
                        <strong>{changeUserTargetUsername}</strong>
                        <span style={{ color: "#2563eb" }}>➔</span>
                        <strong style={{ color: "#16a34a" }}>{changeUserNewUsername}</strong>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="submit-presc-btn"
                      disabled={isSubmittingChangeUserTab}
                      style={{ width: "100%", marginTop: "16px", padding: "12px", fontSize: "14px" }}
                    >
                      {isSubmittingChangeUserTab ? "Updating Username..." : "Save New Username 💾"}
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* TAB 6: Doctor Entry Form */}
          {activeTab === "addDoctor" && (
            <section className="dashboard-section form-section">
              <h3>🩺 Doctor Registration & Clinical Profile Setup</h3>
              <div className="tab-account-badge" style={{ marginBottom: "12px" }}>
                🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
              </div>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "-4px", marginBottom: "20px" }}>
                Add a new verified doctor to Hospital CRM with credentials and clinical attributes.
              </p>

              <form onSubmit={handleCreateDoctorEntry} className="prescription-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Doctor Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Kumar"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      required
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="rajesh.kumar@hospital.com"
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      required
                      disabled={isSubmittingDoc}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Account Password</label>
                    <input
                      type="text"
                      placeholder="Password123"
                      value={docPassword}
                      onChange={(e) => setDocPassword(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>

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
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={docContact}
                      onChange={(e) => setDocContact(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group">
                    <label>Specialty / Doctor Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Cardiologist, Neurologist, General Physician"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      required
                      disabled={isSubmittingDoc}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      value={docExp}
                      onChange={(e) => setDocExp(e.target.value)}
                      required
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group">
                    <label>Consultation Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={docFee}
                      onChange={(e) => setDocFee(e.target.value)}
                      required
                      disabled={isSubmittingDoc}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Abilities / Special Skills</label>
                    <input
                      type="text"
                      placeholder="e.g. Heart Surgery, ECG, ICU Care"
                      value={docAbilities}
                      onChange={(e) => setDocAbilities(e.target.value)}
                      disabled={isSubmittingDoc}
                    />
                  </div>

                  <div className="form-group">
                    <label>Availability Status</label>
                    <select
                      value={docAvailability}
                      onChange={(e) => setDocAvailability(e.target.value)}
                      disabled={isSubmittingDoc}
                    >
                      <option value="available">Available (🟢 Active for Bookings)</option>
                      <option value="unavailable">Unavailable (🔴 On Leave)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-presc-btn"
                  disabled={isSubmittingDoc}
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  {isSubmittingDoc ? "Registering & Saving Doctor..." : "Submit Doctor Entry to Database 💾"}
                </button>
              </form>
            </section>
          )}

          {/* TAB 7: Patient Entry Form */}
          {activeTab === "addPatient" && (
            <section className="dashboard-section form-section">
              <h3>🧑‍🦽 Patient Registration & Medical Profile Setup</h3>
              <div className="tab-account-badge" style={{ marginBottom: "12px" }}>
                🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
              </div>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "-4px", marginBottom: "20px" }}>
                Add a new patient record to Hospital CRM with demographic & contact information.
              </p>

              <form onSubmit={handleCreatePatientEntry} className="prescription-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Patient Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={patName}
                      onChange={(e) => setPatName(e.target.value)}
                      required
                      disabled={isSubmittingPat}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="priya.sharma@example.com"
                      value={patEmail}
                      onChange={(e) => setPatEmail(e.target.value)}
                      required
                      disabled={isSubmittingPat}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Account Password</label>
                    <input
                      type="text"
                      placeholder="Password123"
                      value={patPassword}
                      onChange={(e) => setPatPassword(e.target.value)}
                      disabled={isSubmittingPat}
                    />
                  </div>

                  <div className="form-group">
                    <label>Age (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={patAge}
                      onChange={(e) => setPatAge(e.target.value)}
                      required
                      disabled={isSubmittingPat}
                    />
                  </div>
                </div>

                <div className="form-row">
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
                    <label>Contact Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9123456780"
                      value={patContact}
                      onChange={(e) => setPatContact(e.target.value)}
                      disabled={isSubmittingPat}
                    />
                  </div>

                  <div className="form-group">
                    <label>Residential Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 102 Green Park, New Delhi"
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
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  {isSubmittingPat ? "Registering & Saving Patient..." : "Submit Patient Entry to Database 💾"}
                </button>
              </form>
            </section>
          )}

          {/* TAB 8: Register & Edit System User */}
          {activeTab === "addUser" && (
            <section className="dashboard-section form-section">
              <h3>⚙️ Register & Edit System User</h3>
              <div className="tab-account-badge" style={{ marginBottom: "12px" }}>
                🛡️ Admin Session: <strong>@{effectiveUsername || "admin"}</strong>
              </div>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "-4px", marginBottom: "20px" }}>
                Select an operation below to register a new user, update username, or modify passwords.
              </p>

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
                  <span>2️⃣ Change Username</span>
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

              {/* MODE 1: REGISTER NEW USER */}
              {userFormMode === "register" && (
                <>
                  {userCreatedMsg && (
                    <div className="alert-banner success" style={{ marginBottom: "15px" }}>
                      <span>✓</span>
                      <div>{userCreatedMsg}</div>
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="prescription-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Jane Doe or Reception Desk 1"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        required
                        disabled={isSubmittingNewUser}
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="jane.doe@hospital.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                        disabled={isSubmittingNewUser}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Initial Password</label>
                        <input
                          type="text"
                          placeholder="Password123"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          disabled={isSubmittingNewUser}
                        />
                      </div>

                      <div className="form-group">
                        <label>Assign Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                          disabled={isSubmittingNewUser}
                        >
                          <option value="doctor">Doctor</option>
                          <option value="patient">Patient</option>
                          <option value="receptionist">Receptionist</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="submit-presc-btn"
                      disabled={isSubmittingNewUser}
                    >
                      {isSubmittingNewUser ? "Creating User in Database..." : "Register User in DB 🚀"}
                    </button>
                  </form>
                </>
              )}

              {/* MODE 2: CHANGE USERNAME */}
              {userFormMode === "editUsername" && (
                <form onSubmit={handleUpdateUserProfile} className="prescription-form">
                  <div className="form-group">
                    <label>Current Username (Target Account)</label>
                    <select
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
                      style={{ marginBottom: "10px" }}
                    >
                      <option value="">-- Or choose from existing users --</option>
                      {allKnownUsers.map((u) => (
                        <option key={String(u.id) + u.username} value={u.username}>
                          {u.name} ({u.username}) [{String(u.role).toUpperCase()}]
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Enter existing username (e.g. doctor123)"
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

                  <div className="form-group">
                    <label>New Username</label>
                    <input
                      type="text"
                      placeholder="e.g. dr_rahul_updated"
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
                    {isSubmittingUsernameEdit ? "Updating Username..." : "Save New Username 💾"}
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
                      <label>New Role</label>
                      <select
                        value={editPassRole}
                        onChange={(e) => setEditPassRole(e.target.value)}
                        disabled={isSubmittingPassEdit}
                      >
                        <option value="doctor">Doctor</option>
                        <option value="patient">Patient</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Account Status</label>
                      <select
                        value={editPassStatus}
                        onChange={(e) => setEditPassStatus(e.target.value)}
                        disabled={isSubmittingPassEdit}
                      >
                        <option value="activate">ACTIVATE (Active)</option>
                        <option value="disable">DISABLE (Suspended)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Set New Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Enter new secure password"
                      value={editNewPasswordVal}
                      onChange={(e) => setEditNewPasswordVal(e.target.value)}
                      disabled={isSubmittingPassEdit}
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-presc-btn"
                    disabled={isSubmittingPassEdit}
                  >
                    {isSubmittingPassEdit ? "Updating Role & Access..." : "Update Role & Access 🔐"}
                  </button>
                </form>
              )}
            </section>
          )}
        </main>
      </div>

      {/* QUICK CHANGE USERNAME MODAL (ACCESSIBLE FROM ALL TABLES & TOP HEADER) */}
      {usernameModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !isSubmittingModalUsername && setUsernameModalOpen(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="modal-header">
              <h3>✏️ Change Username</h3>
              <button
                className="close-modal-btn"
                onClick={() => setUsernameModalOpen(false)}
                disabled={isSubmittingModalUsername}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "#64748b", marginTop: 0, marginBottom: "16px" }}>
              Update account username {modalTargetName ? <>for <strong>{modalTargetName}</strong>.</> : "for target account."}
            </p>

            <form onSubmit={handleModalChangeUsernameSubmit}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
                  Target User (Current Username)
                </label>
                {allKnownUsers.length > 0 && (
                  <select
                    value={modalOldUsername}
                    onChange={(e) => {
                      setModalOldUsername(e.target.value);
                      const found = allKnownUsers.find((u) => u.username === e.target.value);
                      if (found?.name) setModalTargetName(found.name);
                    }}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "8px", fontSize: "13px" }}
                    disabled={isSubmittingModalUsername}
                  >
                    <option value="">-- Choose User from List (Optional) --</option>
                    {allKnownUsers.map((u) => (
                      <option key={String(u.id) + u.username} value={u.username}>
                        {u.name ? `${u.name} (${u.username}) [${String(u.role).toUpperCase()}]` : u.username}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Enter current username (e.g. doctor123)"
                  value={modalOldUsername}
                  onChange={(e) => setModalOldUsername(e.target.value)}
                  required
                  disabled={isSubmittingModalUsername}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
                  New Username
                </label>
                <input
                  type="text"
                  placeholder="Enter new username (e.g. rahul_123)"
                  value={modalNewUsername}
                  onChange={(e) => setModalNewUsername(e.target.value)}
                  required
                  disabled={isSubmittingModalUsername}
                  autoFocus
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              {modalOldUsername && modalNewUsername && (
                <div className="username-preview-box" style={{ marginTop: 0, marginBottom: "16px", padding: "10px 14px", fontSize: "13px" }}>
                  <span>Change:</span>
                  <strong>{modalOldUsername}</strong>
                  <span style={{ color: "#2563eb" }}>➔</span>
                  <strong style={{ color: "#16a34a" }}>{modalNewUsername}</strong>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setUsernameModalOpen(false)}
                  disabled={isSubmittingModalUsername}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-presc-btn"
                  disabled={isSubmittingModalUsername}
                >
                  {isSubmittingModalUsername ? "Updating..." : "Save New Username 💾"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR PROFILE MODAL */}
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

      {/* EDIT PATIENT PROFILE MODAL */}
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
