import { useState, useEffect } from 'react';
import { Clock, PlusCircle, Sliders, ChevronRight, Database, Droplet, Package, Settings, Check, X } from 'react-feather';
import mqtt from 'mqtt';
import axios from 'axios';
import { SERVER_URL } from '../config/config';

const Dashboard = () => {
    const [foodLevel, setFoodLevel] = useState(null);
    const [portionSize, setPortionSize] = useState(50);
    const [schedules, SetSchedules] = useState([]);
    const [errorAlert, setErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [newScheduleTime, setNewScheduleTime] = useState("");
    const [newSchedulePortion, setNewSchedulePortion] = useState(50);

    useEffect(() => {
        // Connect using WebSocket if supported
        const client = mqtt.connect('ws://localhost:9001');

        client.on('connect', () => {
            client.subscribe('petfeeder/foodLevel', (err) => {
                if (!err) {
                    console.log('Subscribed to food level topic');
                }
            });
        });

        client.on('message', (topic, message) => {
            if (topic === 'petfeeder/foodLevel') {
                const data = JSON.parse(message.toString());
                console.log('Received food level:', data.foodLevel);

                setFoodLevel(data.foodLevel);
            }
        });

        getFoodLevel();
        getSchedule();

        return () => {
            client.end();
        };
    }, []);

    const addSchedule = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(SERVER_URL + "/schedules", {
                time: newScheduleTime,
                portion: newSchedulePortion
            });

            // Update schedules list
            getSchedule();

            // Reset form and hide it
            setNewScheduleTime("");
            setNewSchedulePortion(50);
            setShowScheduleForm(false);

            // Show success alert
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
            }, 2000);
        } catch (error) {
            setErrorMessage(error.message || "Failed to add schedule");
            setErrorAlert(true);
            setTimeout(() => {
                setErrorAlert(false);
            }, 3000);
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

    const getFoodLevel = async () => {
        try {
            const res = await axios.get(SERVER_URL + "/status");

            setFoodLevel(res.data.foodLevel);
        } catch (error) {
            console.error(error);
        }
    }

    const feed = async () => {
        try {
            const res = await axios.post(SERVER_URL + "/feed", {
                portion: portionSize,
            });

            console.log(res.data);

            setFoodLevel(res.data.foodLevel);
            setShowAlert(true);

            // Auto-dismiss alert after 2 seconds
            setTimeout(() => {
                setShowAlert(false);
            }, 2000);
        } catch (error) {
            if (error.response?.data?.message === "Not enough food available for the requested portion") {
                setErrorMessage("Not enough food available for the requested portion");
            } else {
                setErrorMessage(error.message || "An error occurred while feeding");
                console.error(error);
            }

            setErrorAlert(true);

            setTimeout(() => {
                setErrorAlert(false);
            }, 3000);
        }
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            {showAlert && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
                    <div className="bg-white py-4 px-6 rounded-xl shadow-2xl border border-green-300 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Success!</h3>
                            <p className="text-sm text-gray-600">Food dispensed: {portionSize}g</p>
                        </div>
                        <button
                            onClick={() => setShowAlert(false)}
                            className="ml-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            {errorAlert && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
                    <div className="bg-white py-4 px-6 rounded-xl shadow-2xl border border-red-300 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center">
                            <X className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Error</h3>
                            <p className="text-sm text-gray-600">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorAlert(false)}
                            className="ml-6 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-5xl font-bold text-gradient">
                                    {foodLevel}%
                                </div>
                                <span className="text-gray-500 text-sm">Remaining</span>
                            </div>
                            <svg className="transform -rotate-90 w-full h-full">
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" style={{ stopColor: '#2563eb' }} />
                                        <stop offset="100%" style={{ stopColor: '#9333ea' }} />
                                    </linearGradient>
                                </defs>
                                <circle cx="50%" cy="50%" r="45%" className="stroke-current text-gray-200"
                                    strokeWidth="8%" fill="none" />
                                <circle cx="50%" cy="50%" r="45%" className="gradient-stroke"
                                    strokeWidth="8%" fill="none"
                                    strokeDasharray={`${2 * Math.PI * 45}%`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - foodLevel / 100)}%`}
                                />
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
                                <div key={index} className="group flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
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
                                        <button className="text-gray-400 hover:text-purple-600 transition-colors">
                                            <Sliders className="w-5 h-5" />
                                        </button>
                                    </div>
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