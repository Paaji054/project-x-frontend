import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LiveProfilePhoto from "../../components/LiveProfilePhoto";
import { useUserProfile } from "../../hooks/useUserProfile";
import { creditsService, userService } from "../../services";
import { toast } from "react-hot-toast";
import { FiPackage, FiClock, FiCheck } from "react-icons/fi";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("store");
  const { profilePhoto, profileVideo } = useUserProfile();
  const [packages, setPackages] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "store") {
        const [packagesData, balanceData] = await Promise.all([
          creditsService.getPackages(),
          userService.getCreditsBalance()
        ]);
        setPackages(packagesData || []);
        setUserCredits(balanceData.credits || 0);
      } else {
        const historyData = await creditsService.getPurchases(currentPage, 10);
        setPurchaseHistory(historyData.purchases || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId) => {
    try {
      setLoading(true);
      const orderData = await creditsService.createOrder(packageId);
      
      if (orderData && window.Razorpay) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'ProjectX Credits',
          description: 'Purchase Credits',
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              await creditsService.verifyPayment({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });
              toast.success('Purchase successful!');
              loadData();
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: JSON.parse(localStorage.getItem('user') || '{}').fullName,
            email: JSON.parse(localStorage.getItem('user') || '{}').email
          },
          theme: {
            color: '#770524'
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      toast.error('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto h-[calc(100vh-7.5rem)] md:h-[calc(100vh-4rem)]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Current Balance */}
        <div className="mb-6 bg-gradient-to-r from-primary-400 via-primary to-primary-700 rounded-lg p-6 text-center">
          <p className="text-white/80 text-sm mb-2">Available Credits</p>
          <p className="text-4xl font-bold text-white">{userCredits.toLocaleString()}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("store")}
            className={`relative pb-4 text-lg font-medium transition-colors duration-300 ${activeTab === "store" ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            Store
            {activeTab === "store" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 via-primary to-primary-700"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`relative pb-4 text-lg font-medium transition-colors duration-300 ${activeTab === "history" ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            History
            {activeTab === "history" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 via-primary to-primary-700"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary-400 via-primary to-primary-700 p-6 md:p-12 text-center"
              >
                <div className="space-y-3 md:space-y-4">
                  <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-black dark:text-white leading-tight">
                    Enjoy the integration of AI with Just One Click
                  </h2>
                  <p className="text-xs md:text-sm lg:text-base text-black/80 dark:text-white/90 max-w-3xl mx-auto leading-relaxed">
                    Don't miss out on features like AI avatar, image, caption, bio, and theme generation and many exciting features
                  </p>
                </div>
              </motion.div>

              {/* Buy Credits Section */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white flex items-center">
                  <FiPackage className="mr-3" />
                  Buy Credits
                </h3>

                {/* Credit Packages */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : packages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {packages.map((pkg, index) => (
                      <motion.div
                        key={pkg._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className={`bg-gray-100 dark:bg-[#1a1a1a] border ${
                          pkg.isPopular 
                            ? 'border-primary ring-2 ring-primary/50' 
                            : 'border-gray-300 dark:border-gray-800'
                        } rounded-lg p-6 cursor-pointer hover:border-primary transition-all duration-300 relative`}
                      >
                        {pkg.isPopular && (
                          <div className="absolute -top-3 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full">
                            Most Popular
                          </div>
                        )}
                        <div className="space-y-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-700 rounded-lg flex items-center justify-center">
                            <FiPackage className="w-10 h-10 text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-black dark:text-white mb-2">
                              {pkg.name}
                            </h4>
                            <p className="text-3xl font-bold text-primary mb-1">
                              {pkg.credits.toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-sm mb-3">Credits</p>
                            <p className="text-2xl font-bold text-black dark:text-white mb-4">
                              ₹{pkg.price.toLocaleString()}
                            </p>
                            {pkg.features && pkg.features.length > 0 && (
                              <ul className="space-y-2 mb-4">
                                {pkg.features.map((feature, i) => (
                                  <li key={i} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                    <FiCheck className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePurchase(pkg._id)}
                              disabled={loading}
                              className="w-full px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                              Purchase Now
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No packages available at the moment
                  </div>
                )}
              </div>

              {/* Rewards & Offers Section */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white">Rewards & Offers</h3>
                <div className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-800 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No rewards or offers available at the moment</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Purchase History */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white flex items-center">
                  <FiClock className="mr-3" />
                  Purchase History
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : purchaseHistory.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Package
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Credits
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {purchaseHistory.map((purchase, index) => (
                          <tr key={purchase._id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {purchase.packageName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {purchase.credits?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ₹{purchase.amount?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                purchase.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : purchase.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {purchase.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-800 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                    <FiClock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No purchase history yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}