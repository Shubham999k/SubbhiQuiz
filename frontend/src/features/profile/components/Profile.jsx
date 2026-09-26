import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../services/api";
import Cropper from "react-easy-crop";
import toast from "react-hot-toast";
import { 
  User, Mail, Calendar, Edit3, Save, CheckCircle,
  BookOpen, Target, Trophy, Award, Camera, X, GraduationCap
} from "lucide-react";

// Helper function to crop the image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); 
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  // Resize DP to 256x256
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    256,
    256
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Cropper State
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsPreviewOpen(false);
        if (isCropperOpen) closeCropper();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCropperOpen]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getQuizHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history for profile:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchHistory();
  }, []);

  const getAccuracy = (h) => (h.total > 0 ? (h.score / h.total) * 100 : 0);

  const totalQuizzes = history.length;
  const averageScore = history.length > 0
    ? Math.round(history.reduce((acc, curr) => acc + getAccuracy(curr), 0) / history.length)
    : 0;
  const bestScore = history.length > 0 ? Math.max(...history.map(getAccuracy)) : 0;
  const totalQuestionsSolved = history.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedData = await api.updateProfile({ name });
      updateUser(updatedData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload Handlers
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropperOpen(true);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadCroppedImage = async () => {
    if (!croppedAreaPixels) {
      toast.error("Please crop the image first.");
      return;
    }
    try {
      setIsSaving(true);
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const updatedData = await api.updateProfile({ 
        name: user.name, 
        avatar: croppedImageBase64 
      });
      
      updateUser(updatedData);
      toast.success("Profile picture updated!");
      closeCropper();
    } catch (error) {
      console.error(error);
      alert("UPLOAD ERROR: " + (error.message || "Unknown error"));
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsSaving(false);
    }
  };

  const closeCropper = () => {
    setIsCropperOpen(false);
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 lg:overflow-hidden overflow-y-auto hide-scrollbar">
      
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-base-content tracking-tight">My Profile</h1>
        </div>
      </div>

      {/* Grid Layout to fit in single page on LG, stacked on SM */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 flex-1 lg:overflow-hidden">
        
        {/* Left Column: Avatar & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:overflow-y-auto shrink-0">
          
          {/* Avatar Card */}
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6 flex flex-col items-center relative overflow-hidden group">
            {/* Abstract bg */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[50%] -right-[10%] w-[100%] h-[150%] bg-primary/10 rounded-full blur-3xl transform rotate-12 transition-transform duration-700 group-hover:scale-110"></div>
            </div>

            <div className="relative mb-4 z-10 group">
              <div 
                className="w-32 h-32 rounded-xl bg-gradient-to-tr from-primary to-secondary p-1 shadow-lg relative group-hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setIsPreviewOpen(true)}
              >
                <div className="w-full h-full rounded-xl bg-base-100 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary uppercase">
                      {user?.name?.charAt(0) || "S"}
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-3 -right-3 bg-primary text-white p-2.5 rounded-full shadow-lg ring-4 ring-base-100 hover:scale-110 active:scale-95 transition-all z-20"
                title="Change Profile Picture"
              >
                <Camera size={20} />
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <h2 className="text-2xl font-extrabold text-base-content z-10 mt-3 w-full text-center truncate px-2">{user?.name || "Student"}</h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-3 py-1 rounded-full mt-2 z-10">
              <GraduationCap size={14} /> Student
            </div>
          </div>

          {/* Stats Grid */}
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-5">
            <h3 className="text-lg font-bold text-base-content flex items-center gap-2 mb-4">
              <Trophy className="text-warning" size={18} /> Your Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-base-content/60 mb-0.5 truncate">Taken</p>
                  <h4 className="text-lg font-bold text-base-content truncate">{loadingStats ? "-" : totalQuizzes}</h4>
                </div>
              </div>
              <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 flex items-center gap-3">
                <div className="p-2.5 bg-warning/10 text-warning rounded-lg shrink-0">
                  <Target size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-base-content/60 mb-0.5 truncate">Average</p>
                  <h4 className="text-lg font-bold text-base-content truncate">{loadingStats ? "-" : `${averageScore}%`}</h4>
                </div>
              </div>
              <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 flex items-center gap-3">
                <div className="p-2.5 bg-warning/10 text-warning rounded-lg shrink-0">
                  <Trophy size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-base-content/60 mb-0.5 truncate">Best</p>
                  <h4 className="text-lg font-bold text-base-content truncate">{loadingStats ? "-" : `${Math.round(bestScore)}%`}</h4>
                </div>
              </div>
              <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 flex items-center gap-3">
                <div className="p-2.5 bg-success/10 text-success rounded-lg shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-base-content/60 mb-0.5 truncate">Solved</p>
                  <h4 className="text-lg font-bold text-base-content truncate">{loadingStats ? "-" : totalQuestionsSolved}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Info Form */}
        <div className="lg:col-span-8 flex flex-col lg:min-h-0 pb-4 shrink-0">
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 flex flex-col lg:h-full lg:overflow-hidden">
            <div className="p-5 border-b border-base-300 flex justify-between items-center bg-base-200/30 flex-shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-base-content truncate">Personal Information</h3>
                  <p className="text-xs font-medium text-base-content/60 mt-0.5 hidden sm:block truncate">Your basic details and account information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) setName(user?.name || ""); // Reset on cancel
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${isEditing ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
              >
                {isEditing ? <CheckCircle size={16} /> : <Edit3 size={16} />}
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            <div className="p-6 md:p-8 flex-1 lg:overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                <div>
                  <div className="mb-2 pl-1">
                    <label className="block text-sm font-semibold text-base-content">
                      Full Name
                    </label>
                    <p className="text-xs text-base-content/60 mt-0.5">This is your display name on the platform.</p>
                  </div>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isEditing ? 'text-primary' : 'text-base-content/40'}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`pl-12 block w-full rounded-xl sm:text-sm border-2 py-3 transition-all ${isEditing ? 'border-primary focus:ring-2 focus:ring-primary/20 bg-base-100 text-base-content' : 'border-transparent bg-base-200 text-base-content/70 cursor-not-allowed'}`}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 pl-1">
                    <label className="block text-sm font-semibold text-base-content">
                      Email Address
                    </label>
                    <p className="text-xs text-base-content/60 mt-0.5">This email is used for login and important notifications.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="pl-12 block w-full rounded-xl border-2 border-transparent bg-base-200 text-base-content/50 sm:text-sm py-3 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] flex items-center gap-1 text-base-content/50 pl-2">
                    <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">i</span> Email address cannot be changed.
                  </p>
                </div>
                
                <div>
                  <div className="mb-2 pl-1">
                    <label className="block text-sm font-semibold text-base-content">
                      Member Since
                    </label>
                    <p className="text-xs text-base-content/60 mt-0.5">The date you joined our platform.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/40">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      disabled
                      value={new Date().getFullYear()}
                      className="pl-12 block w-full rounded-xl border-2 border-transparent bg-base-200 text-base-content/50 sm:text-sm py-3 cursor-not-allowed"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 mt-4 animate-in fade-in">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center py-2.5 px-6 shadow-md shadow-primary/20 text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Cropper Modal */}
      {isCropperOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-base-300">
            <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
              <h3 className="font-bold text-base-content">Crop Profile Picture</h3>
              <button onClick={closeCropper} className="p-1 hover:bg-base-300 rounded-md transition-colors text-base-content/70">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-black/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-4 flex justify-between items-center gap-4 bg-base-100">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="range range-primary range-sm flex-1"
              />
              <button
                onClick={uploadCroppedImage}
                disabled={isSaving}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center"
              >
                {isSaving ? "Saving..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Picture Preview Modal */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in cursor-zoom-out"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-2xl w-full aspect-square md:aspect-auto md:h-[80vh] flex items-center justify-center pointer-events-none">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain pointer-events-auto" />
            ) : (
              <div className="w-full h-full max-h-[80vh] aspect-square rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-2xl pointer-events-auto">
                <span className="text-[12rem] font-bold text-base-100 uppercase drop-shadow-lg">
                  {user?.name?.charAt(0) || "S"}
                </span>
              </div>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}
              className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors pointer-events-auto"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
