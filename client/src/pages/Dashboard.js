import { useState } from 'react';
import { Clock, PlusCircle, Sliders, ChevronRight, Database, Droplet, Package, Settings } from 'react-feather';

const Dashboard = () => {
    const [foodLevel, setFoodLevel] = useState(100);
    const [portionSize, setPortionSize] = useState(50);
    const [scheduledFeedings] = useState([
        { time: '08:00', portion: 30 },
        { time: '12:30', portion: 40 },
        { time: '18:00', portion: 50 },
    ]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-gray-800">
                        <span className="text-gradient">
                            SmartFeeder
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
                            <span className="text-sm text-blue-600 font-medium">Refill</span>
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
                            <button className="p-2 bg-purple-100 rounded-lg text-purple-600 hover:bg-purple-200 transition-colors">
                                <PlusCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {scheduledFeedings.map((feeding, index) => (
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
                            <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center space-x-3 hover:scale-[1.02]">
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