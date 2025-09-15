import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC4GOIC2VzO-fEgTGXEj-dK8I6sQvbARmA",
    authDomain: "angiecrochetapp.firebaseapp.com",
    projectId: "angiecrochetapp",
    storageBucket: "angiecrochetapp.firebasestorage.app",
    messagingSenderId: "938895412535",
    appId: "1:938895412535:web:32577c45b7b14705c49eb2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// A self-contained modal component for adding/editing projects
const ProjectModal = ({ project, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'wishlist',
        pattern: '',
        yarn: '',
        hookSize: '',
        notesLink: '',
        notes: '',
        images: [],
        mainImage: ''
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                category: project.category || 'wishlist',
                pattern: project.pattern || '',
                yarn: project.yarn || '',
                hookSize: project.hookSize || '',
                notesLink: project.notesLink || '',
                notes: project.notes || '',
                images: project.images || [],
                mainImage: project.mainImage || ''
            });
        } else {
            setFormData({
                name: '',
                category: 'wishlist',
                pattern: '',
                yarn: '',
                hookSize: '',
                notesLink: '',
                notes: '',
                images: [],
                mainImage: ''
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = async (e) => {
        setIsProcessing(true);
        const files = Array.from(e.target.files);
        setImageFiles(files);
        const newImageUrls = await resizeAndCompressImages(files);
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImageUrls],
            mainImage: prev.mainImage || newImageUrls[0] || ''
        }));
        setIsProcessing(false);
    };

    const handleSetMainImage = (url) => {
        setFormData(prev => ({ ...prev, mainImage: url }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        await onSave({ ...project, ...formData });
        setIsProcessing(false);
        onClose();
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            await onDelete(project.id);
            onClose();
        }
    };

    const resizeAndCompressImages = async (files) => {
        const imageUrls = [];
        for (const file of files) {
            const resizedImage = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxWidth = 800;
                        const maxHeight = 800;
                        if (width > height) {
                            if (width > maxWidth) {
                                height = Math.round(height * (maxWidth / width));
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = Math.round(width * (maxHeight / height));
                                height = maxHeight;
                            }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
            imageUrls.push(resizedImage);
        }
        return imageUrls;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-11/12 max-w-2xl transform flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 pb-2">
                    <h3 className="text-2xl font-bold text-gray-800 text-center">
                        {project ? 'Edit Project' : 'Add New Project'}
                    </h3>
                </div>
                <div className="p-6 pt-2 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" id="projectId" value={project?.id || ''} />
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input type="text" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                            <select id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="wishlist">Wishlist</option>
                                <option value="wip">Work in Progress</option>
                                <option value="finished">Finished</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="pattern" className="block text-sm font-medium text-gray-700">Pattern</label>
                            <input type="text" id="pattern" value={formData.pattern} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="yarn" className="block text-sm font-medium text-gray-700">Yarn</label>
                            <input type="text" id="yarn" value={formData.yarn} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="hookSize" className="block text-sm font-medium text-gray-700">Hook Size</label>
                            <input type="text" id="hookSize" value={formData.hookSize} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="notesLink" className="block text-sm font-medium text-gray-700">Link to Apple Notes</label>
                            <input type="text" id="notesLink" value={formData.notesLink} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea id="notes" rows="4" value={formData.notes} onChange={handleChange} className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                        <div>
                            <label htmlFor="images" className="block text-sm font-medium text-gray-700">Images</label>
                            <input type="file" id="images" multiple accept="image/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            <div className="flex flex-wrap gap-2 mt-4">
                                {formData.images.map((imgUrl, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                                        <img src={imgUrl} alt="Project Image" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => handleSetMainImage(imgUrl)} className="bg-white text-gray-800 px-2 py-1 text-xs rounded-full shadow-md hover:bg-gray-100">
                                                {formData.mainImage === imgUrl ? 'Main' : 'Set Main'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-6 pt-2 flex justify-between items-center bg-white/90 backdrop-blur-sm rounded-b-3xl">
                    <button onClick={handleSubmit} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl shadow-md transition duration-200 disabled:bg-gray-400">
                        {isProcessing ? 'Saving...' : 'Save Project'}
                    </button>
                    <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-xl transition duration-200">
                        Cancel
                    </button>
                    {project && (
                        <button type="button" onClick={handleDelete} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl shadow-md transition duration-200 disabled:bg-gray-400">
                            Delete Project
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [isVerticalView, setIsVerticalView] = useState(false);
    const [showFinishedOnly, setShowFinishedOnly] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                await signInAnonymously(auth);
                setUserId(auth.currentUser.uid);
                setIsAuthReady(true);
            } catch (error) {
                console.error("Firebase authentication failed:", error);
            }
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;

        const projectsRef = collection(db, 'artifacts', firebaseConfig.projectId, 'users', userId, 'projects');
        const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(fetchedProjects);
            setFilteredProjects(fetchedProjects);
            console.log("Projects loaded successfully.");
        }, (error) => {
            console.error("Error loading projects:", error);
        });

        return () => unsubscribe();
    }, [isAuthReady, userId]);

    const handleOpenModal = (project = null) => {
        setCurrentProject(project);
        setShowModal(true);
    };

    const handleSaveProject = async (projectData) => {
        if (!isAuthReady) return;
        try {
            if (projectData.id) {
                const docRef = doc(db, 'artifacts', firebaseConfig.projectId, 'users', userId, 'projects', projectData.id);
                await setDoc(docRef, projectData, { merge: true });
            } else {
                await addDoc(collection(db, 'artifacts', firebaseConfig.projectId, 'users', userId, 'projects'), {
                    ...projectData,
                    createdAt: serverTimestamp()
                });
            }
        } catch (e) {
            console.error("Error saving project:", e);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!isAuthReady) return;
        try {
            await deleteDoc(doc(db, 'artifacts', firebaseConfig.projectId, 'users', userId, 'projects', projectId));
        } catch (e) {
            console.error("Error deleting project:", e);
        }
    };

    const handleFilterProjects = useCallback((query) => {
        const lowerQuery = query.toLowerCase();
        setFilteredProjects(
            projects.filter(project => {
                const searchString = `${project.name || ''} ${project.pattern || ''} ${project.yarn || ''} ${project.hookSize || ''} ${project.notes || ''}`.toLowerCase();
                return searchString.includes(lowerQuery);
            })
        );
    }, [projects]);

    const handleToggleView = () => {
        setIsVerticalView(prev => !prev);
    };

    const handleToggleCollageView = () => {
        setShowFinishedOnly(prev => !prev);
    };

    const renderProjects = useCallback((category) => {
        const categoryProjects = filteredProjects.filter(p => p.category === category).sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
        return categoryProjects.length > 0 ? (
            <div className={`flex ${isVerticalView ? 'flex-col space-y-4' : 'flex-row overflow-x-auto space-x-4'}`}>
                {categoryProjects.map(project => (
                    <div key={project.id} onClick={() => handleOpenModal(project)} className="project-card bg-white p-4 rounded-xl shadow-sm cursor-pointer border border-gray-200 hover:border-blue-500">
                        {project.mainImage && (
                            <img src={project.mainImage} alt={project.name} className="w-full h-24 object-cover mb-2 rounded-lg" />
                        )}
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 text-xl break-all">{project.name}</h3>
                            <div className={`w-2.5 h-2.5 rounded-full ${project.category === 'wishlist' ? 'bg-blue-500' : project.category === 'wip' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-gray-500 text-center py-4">No projects in this category.</p>
        );
    }, [filteredProjects, isVerticalView, handleOpenModal]);

    const renderCollage = () => {
        let images = [];
        const projectsToShow = showFinishedOnly ? projects.filter(p => p.category === 'finished') : projects;
        
        projectsToShow.forEach(project => {
            if (project.images && project.images.length > 0) {
                const imageUrl = project.mainImage || project.images[0];
                if (imageUrl) {
                    images.push({ url: imageUrl, createdAt: project.createdAt });
                }
            }
        });

        images.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        const imagesToDisplay = images.slice(0, 12);

        return imagesToDisplay.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagesToDisplay.map((imgData, index) => (
                    <img key={index} src={imgData.url} className="w-full h-full rounded-lg object-cover shadow-sm transition-transform hover:scale-105" />
                ))}
            </div>
        ) : (
            <p className="text-sm text-gray-500 text-center py-4">No photos to display yet.</p>
        );
    };

    return (
        <div className="p-4 sm:p-8 min-h-screen" style={{ backgroundColor: '#c4c8f5', fontFamily: 'Inter, sans-serif' }}>
            <div className="container mx-auto mt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                    <div className="flex flex-col items-center sm:items-start mb-2 sm:mb-0">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 drop-shadow-lg mb-0">Angie's Crochet Projects</h1>
                        <h2 className="text-lg sm:text-xl font-medium text-gray-700">Crafting happiness, one stitch at a time.</h2>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={handleToggleView} className="bg-white/90 text-purple-600 font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 hover:bg-gray-100">
                            Switch to {isVerticalView ? 'Gallery' : 'List'} View
                        </button>
                        <button onClick={() => handleOpenModal()} className="bg-white/90 text-purple-600 font-semibold py-2 px-4 rounded-xl shadow-md transition duration-200 hover:bg-gray-100">
                            + Add Project
                        </button>
                    </div>
                </div>
                
                <div className="mb-8">
                    <input type="text" id="searchBar" onInput={(e) => handleFilterProjects(e.target.value)} placeholder="Search projects by name, pattern, yarn, notes or hook size..." className="w-full p-3 rounded-xl border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Wishlist</h2>
                        {renderProjects('wishlist')}
                    </div>
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Work in Progress</h2>
                        {renderProjects('wip')}
                    </div>
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Finished</h2>
                        {renderProjects('finished')}
                    </div>
                </div>
                
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Recent Creations</h2>
                        <button onClick={handleToggleCollageView} className="bg-gray-200 text-gray-700 text-sm font-semibold py-2 px-4 rounded-full transition duration-200 hover:bg-gray-300">
                            Show {showFinishedOnly ? 'All Photos' : 'Finished Only'}
                        </button>
                    </div>
                    {renderCollage()}
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-gray-700 text-center mt-16 mb-4">Does it cro-slay?</h2>
            </div>
            {showModal && <ProjectModal project={currentProject} onClose={() => setShowModal(false)} onSave={handleSaveProject} onDelete={handleDeleteProject} />}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
