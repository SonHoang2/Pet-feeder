import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import axios from 'axios';
import { SERVER_URL } from '../config/config';
import { Clock, PlusCircle, Sliders, ChevronRight, Database, Droplet, Package, Settings, Check, X, Trash2 } from 'react-feather';
import Alert from '../components/Alert'

const Dashboard = () => {
    const [foodWeight, setFoodWeight] = useState({
        currentFoodWeight: null,
        maxFoodWeight: null,
        percentage: null,
    });
    const [portionSize, setPortionSize] = useState(50);
    const [schedules, SetSchedules] = useState([]);
    const [alerts, setAlerts] = useState({
        success: { show: false, message: "", title: "Success!" },
        error: { show: false, message: "", title: "Error" },
        warning: { show: false, message: "", title: "Warning" },
        loading: { show: false, message: "", title: "Loading" },
    });

    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [newScheduleTime, setNewScheduleTime] = useState("");
    const [newSchedulePortion, setNewSchedulePortion] = useState(50);

    const [editingScheduleId, setEditingScheduleId] = useState(null);
    const [editScheduleTime, setEditScheduleTime] = useState("");
    const [editSchedulePortion, setEditSchedulePortion] = useState(50);

    useEffect(() => {
        // Connect using WebSocket if supported
        const client = mqtt.connect('ws://localhost:9001');

        client.on('connect', () => {
            client.subscribe('petfeeder/currentFoodWeight', (err) => {
                if (!err) {
                    console.log('Subscribed to food level topic');
                }
            });
        });

        client.on('message', (topic, message) => {
            console.log(`Received message on topic ${topic}:`, message.toString());

            if (topic === 'petfeeder/currentFoodWeight') {
                const data = JSON.parse(message.toString());

                const { currentFoodWeight, maxFoodWeight } = data;
                const percentage = Math.round((currentFoodWeight / maxFoodWeight) * 100);

                console.log('Received food level:', percentage);
                console.log('Current food weight:', currentFoodWeight);

                setFoodWeight(prev => ({
                    ...prev,
                    currentFoodWeight: data.currentFoodWeight,
                    maxFoodWeight: data.maxFoodWeight,
                    percentage: percentage,
                }));

                if (percentage < 20) {
                    showWarningAlert('Food level is below 20%. Please refill soon.', 'Low Food Alert');
                }
            }
        });

        getFoodWeight();
        getSchedule();

        return () => {
            client.end();
        };
    }, []);

    const showLoadingAlert = (message, title = "Processing...") => {
        setAlerts({
            ...alerts,
            loading: { show: true, message, title }
        });

    };

    const hideLoadingAlert = () => {
        setAlerts(prev => ({
            ...prev,
            loading: { ...prev.loading, show: false }
        }));
    };

    const showSuccessAlert = (message, title = "Success!") => {
        setAlerts({
            ...alerts,
            success: { show: true, message, title }
        });
        setTimeout(() => {
            setAlerts(prev => ({
                ...prev,
                success: { ...prev.success, show: false }
            }));
        }, 2000);
    };

    const showErrorAlert = (message, title = "Error") => {
        setAlerts({
            ...alerts,
            error: { show: true, message, title }
        });
        setTimeout(() => {
            setAlerts(prev => ({
                ...prev,
                error: { ...prev.error, show: false }
            }));
        }, 3000);
    };

    const showWarningAlert = (message, title = "Warning") => {
        setAlerts({
            ...alerts,
            warning: { show: true, message, title }
        });
        setTimeout(() => {
            setAlerts(prev => ({
                ...prev,
                warning: { ...prev.warning, show: false }
            }));
        }, 3000);
    };

    const addSchedule = async (e) => {
        e.preventDefault();
        try {
            await axios.post(SERVER_URL + "/schedules", {
                time: newScheduleTime,
                portion: newSchedulePortion
            });

            // Update schedules list
            getSchedule();

            // Reset form and hide it
            setNewScheduleTime("");
            setNewSchedulePortion(50);
            setShowScheduleForm(false);

            // Show success alert using the new alert system
            showSuccessAlert("Schedule added successfully");
        } catch (error) {
            showErrorAlert(error?.response?.data?.message || "Failed to add schedule");
        }
    };

    const startEditing = (schedule) => {
        setEditingScheduleId(schedule.id);
        setEditScheduleTime(schedule.time);
        setEditSchedulePortion(schedule.portion);
    };

    const cancelEditing = () => {
        setEditingScheduleId(null);
    };

    const updateSchedule = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(`${SERVER_URL}/schedules/${editingScheduleId}`, {
                time: editScheduleTime,
                portion: editSchedulePortion
            });

            // Refresh schedules
            getSchedule();

            // Close edit form
            setEditingScheduleId(null);

            // Show success alert using the new alert system
            showSuccessAlert("Schedule updated successfully");
        } catch (error) {
            showErrorAlert(error?.response?.data?.message || "Failed to update schedule");
        }
    };


    const deleteSchedule = async (id) => {
        if (window.confirm("Are you sure you want to delete this schedule?")) {
            try {
                await axios.delete(`${SERVER_URL}/schedules/${id}`);

                // Refresh schedules
                getSchedule();

                // Close edit form if open
                setEditingScheduleId(null);

                // Show success alert using the new alert system
                showSuccessAlert("Schedule deleted successfully");
            } catch (error) {
                showErrorAlert(error?.response?.data?.message || "Failed to delete schedule");
            }
        }
    };

    const getSchedule = async () => {
        try {
            const res = await axios.get(SERVER_URL + "/schedules");
            console.log(res.data.schedules);
            SetSchedules(res.data.schedules);
        } catch (error) {
            console.error(error);
        }
    }

    const getFoodWeight = async () => {
        try {
            const res = await axios.get(SERVER_URL + "/status");

            const { currentFoodWeight, maxFoodWeight } = res.data;

            const percentage = Math.round((currentFoodWeight / maxFoodWeight) * 100);

            setFoodWeight(prev => ({
                ...prev,
                currentFoodWeight: currentFoodWeight,
                maxFoodWeight: maxFoodWeight,
                percentage: percentage,
            }));
        } catch (error) {
            console.error(error);
        }
    }

    const feed = async () => {
        try {
            showLoadingAlert("Dispensing food...", "Please wait");

            const res = await axios.post(SERVER_URL + "/feed", {
                portion: portionSize,
            });

            console.log(res.data);

            hideLoadingAlert();
            showSuccessAlert(`Food dispensed: ${portionSize}g`);

        } catch (error) {
            if (error.response?.data?.message === "Not enough food available for the requested portion") {
                showErrorAlert("Not enough food available for the requested portion");
            } else {
                showErrorAlert(error.message || "An error occurred while feeding");
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <Alert
                type="success"
                title={alerts.success.title}
                message={alerts.success.message}
                isVisible={alerts.success.show}
                onClose={() => setAlerts(prev => ({ ...prev, success: { ...prev.success, show: false } }))}
            />
            <Alert
                type="error"
                title={alerts.error.title}
                message={alerts.error.message}
                isVisible={alerts.error.show}
                onClose={() => setAlerts(prev => ({ ...prev, error: { ...prev.error, show: false } }))}
            />
            <Alert
                type="warning"
                title={alerts.warning.title}
                message={alerts.warning.message}
                isVisible={alerts.warning.show}
                onClose={() => setAlerts(prev => ({ ...prev, warning: { ...prev.warning, show: false } }))}
            />
            <Alert
                type="loading"
                title={alerts.loading.title}
                message={alerts.loading.message}
                isVisible={alerts.loading.show}
                onClose={() => setAlerts(prev => ({ ...prev, loading: { ...prev.loading, show: false } }))}
            />
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-gray-800">
                        <span className="text-gradient">
                            PetFeeder
                        </span>
                    </h1>
                    <div className="flex items-center space-x-4">
                        <button className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <Settings className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Main Dashboard */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Food Storage */}
                    <div className="col-span-1 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/50">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 flex items-center space-x-2">
                                <Database className="w-6 h-6 text-blue-600" />
                                <span>Food Storage</span>
                            </h2>
                        </div>
                        <div className="relative w-full aspect-square max-w-[200px] mx-auto">
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                <div className="text-4xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {foodWeight.percentage}%
                                </div>
                                <div className="text-gray-600 text-sm font-medium">
                                    {foodWeight.currentFoodWeight}g / {foodWeight.maxFoodWeight}g
                                </div>
                                <span className="text-gray-400 text-xs">Remaining</span>
                            </div>

                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                {/* Background circle with subtle shadow */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    className="fill-white stroke-gray-100"
                                    strokeWidth="8"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}
                                />

                                {/* Progress track */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    className="stroke-gray-200"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                />

                                {/* Progress indicator with gradient and animation */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    className="stroke-[url(#gradient)]"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={283} // 2 * π * 45
                                    strokeDashoffset={283 * (1 - foodWeight.percentage / 100)}
                                    style={{
                                        transition: 'stroke-dashoffset 0.8s ease-out',
                                        transform: 'rotate(-90deg)',
                                        transformOrigin: '50% 50%'
                                    }}
                                />

                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="50%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    {/* Scheduled Feeding */}
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/50">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 flex items-center space-x-2">
                                <Clock className="w-6 h-6 text-purple-600" />
                                <span>Scheduled Feedings</span>
                            </h2>
                            <button
                                className="p-2 bg-purple-100 rounded-lg text-purple-600 hover:bg-purple-200 transition-colors"
                                onClick={() => setShowScheduleForm(!showScheduleForm)}
                            >
                                <PlusCircle className="w-6 h-6" />
                            </button>
                        </div>
                        {showScheduleForm && (
                            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-fadeIn">
                                <h3 className="font-medium text-purple-700 mb-3">Add New Schedule</h3>
                                <form onSubmit={addSchedule} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Feeding Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none"
                                            value={newScheduleTime}
                                            onChange={(e) => setNewScheduleTime(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <label>Portion Size</label>
                                            <span className="font-bold text-purple-600">{newSchedulePortion}g</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                                            value={newSchedulePortion}
                                            onChange={(e) => setNewSchedulePortion(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-2">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            onClick={() => setShowScheduleForm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                                        >
                                            Add Schedule
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        <div className="space-y-4">
                            {schedules?.map((feeding, index) => (
                                <div key={index} className="group flex flex-col p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    {editingScheduleId === feeding.id ? (
                                        // Edit form
                                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 animate-fadeIn">
                                            <form onSubmit={updateSchedule} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Feeding Time</label>
                                                    <input
                                                        type="time"
                                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none"
                                                        value={editScheduleTime}
                                                        onChange={(e) => setEditScheduleTime(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                        <label>Portion Size</label>
                                                        <span className="font-bold text-purple-600">{editSchedulePortion}g</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="10"
                                                        max="100"
                                                        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                                                        value={editSchedulePortion}
                                                        onChange={(e) => setEditSchedulePortion(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex justify-between space-x-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteSchedule(feeding.id)}
                                                        className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors flex items-center"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                                    </button>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="button"
                                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            onClick={cancelEditing}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        // Normal schedule display
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <Clock className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">{feeding.time}</h3>
                                                    <p className="text-sm text-gray-500">Daily schedule</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <span className="text-lg font-bold text-purple-600">{feeding.portion}g</span>
                                                <button
                                                    className="text-gray-400 hover:text-purple-600 transition-colors"
                                                    onClick={() => startEditing(feeding)}
                                                >
                                                    <Sliders className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Control Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Manual Feeding */}
                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/50">
                        <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center space-x-2">
                            <Droplet className="w-6 h-6 text-blue-600" />
                            <span>Manual Feeding</span>
                        </h2>
                        <div className="space-y-6">
                            <button
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center space-x-3 hover:scale-[1.02]"
                                onClick={feed}
                            >
                                <span>Dispense Food Now</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Portion Size</span>
                                    <span className="font-bold text-purple-600">{portionSize}g</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={portionSize}
                                    onChange={(e) => setPortionSize(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer range-lg accent-purple-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Portion Statistics */}
                    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/50">
                        <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center space-x-2">
                            <Package className="w-6 h-6 text-purple-600" />
                            <span>Portion Control</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-blue-50/50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Default Portion</div>
                                <div className="text-2xl font-bold text-purple-600">50g</div>
                            </div>
                            <div className="p-5 bg-purple-50/50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Last Feeding</div>
                                <div className="text-2xl font-bold text-blue-600">45g</div>
                            </div>
                            <div className="p-5 bg-pink-50/50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Daily Average</div>
                                <div className="text-2xl font-bold text-pink-600">42g</div>
                            </div>
                            <div className="p-5 bg-green-50/50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-1">Monthly Usage</div>
                                <div className="text-2xl font-bold text-green-600">12.6kg</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;