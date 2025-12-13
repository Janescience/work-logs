// components/FloatingQuickActions.js
'use client';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faTimes,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import { toast } from 'react-toastify';

const FloatingQuickActions = () => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceDetailsMap, setServiceDetailsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  // Don't show on login/register pages
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(pathname)) return null;

  // Fetch services and their details
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/services');
        if (!res.ok) throw new Error('Failed to fetch services');

        const data = await res.json();
        setServices(data.services || []);

        // Fetch details for all services
        const detailsMap = {};
        for (const service of data.services || []) {
          try {
            const detailsRes = await fetch(`/api/services/${service._id}/details`);
            if (detailsRes.ok) {
              const detailsData = await detailsRes.json();
              detailsMap[service._id] = detailsData.serviceDetails || [];
            }
          } catch (error) {
            console.error(`Error fetching details for service ${service._id}:`, error);
            detailsMap[service._id] = [];
          }
        }
        setServiceDetailsMap(detailsMap);

      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };


  return (
    <>
      {/* Floating Panel */}
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
        isExpanded ? 'translate-x-0' : 'translate-x-64'
      }`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -left-10 top-1/2 -translate-y-1/2 bg-black text-white w-10 h-16 rounded-l-lg hover:bg-gray-800 transition-colors flex items-center justify-center shadow-lg"
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronRight : faChevronLeft} className="text-sm" />
        </button>

        {/* Panel */}
        <div className="bg-white border-l-2 border-y-2 border-black shadow-2xl w-64 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="bg-black text-white px-4 py-3">
            <h3 className="font-light text-sm tracking-wide">SERVICES</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No services found
              </div>
            ) : (
              services.map((service) => {
                const serviceDetails = serviceDetailsMap[service._id] || [];
                const environments = serviceDetails.map(detail => detail.env).sort();
                const hasDetails = environments.length > 0;

                return (
                  <button
                    key={service._id}
                    onClick={() => handleServiceClick(service)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors rounded group border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                        <FontAwesomeIcon icon={faCog} className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{service.name}</div>
                        <div className="flex gap-1 mt-1">
                          {hasDetails ? (
                            environments.map(env => (
                              <span
                                key={env}
                                className={`px-1.5 py-0.5 text-xs rounded ${
                                  env === 'PROD' ? 'bg-red-100 text-red-700' :
                                  env === 'PREPROD' ? 'bg-orange-100 text-orange-700' :
                                  env === 'UAT' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}
                              >
                                {env}
                              </span>
                            ))
                          ) : (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                              No envs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-light">{selectedService.name} - Service Details</h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="hover:bg-gray-800 w-8 h-8 rounded flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Service Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-4">Service Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-900">{selectedService.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Repository:</span>
                      <p className="text-gray-900">
                        {selectedService.repository ? (
                          <a href={selectedService.repository} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:underline break-all">
                            {selectedService.repository}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Deploy By:</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedService.deployBy || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Service Details by Environment */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Environment Details</h4>
                  {serviceDetailsMap[selectedService._id]?.length > 0 ? (
                    <div className="space-y-4">
                      {serviceDetailsMap[selectedService._id].map(detail => (
                        <div key={detail._id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-lg font-semibold text-gray-900">{detail.env}</h5>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {detail.url && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">URL:</span>
                                <p className="text-gray-900">
                                  <a href={detail.url} target="_blank" rel="noopener noreferrer"
                                     className="text-blue-600 hover:underline break-all">
                                    {detail.url}
                                  </a>
                                </p>
                              </div>
                            )}

                            {detail.server && (
                              <div>
                                <span className="font-medium text-gray-700">Server:</span>
                                <p className="text-gray-900 break-all">{detail.server}</p>
                              </div>
                            )}

                            {detail.database1 && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Database 1:</span>
                                <p className="text-gray-900 break-all">{detail.database1}</p>
                              </div>
                            )}

                            {detail.database2 && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Database 2:</span>
                                <p className="text-gray-900 break-all">{detail.database2}</p>
                              </div>
                            )}

                            {detail.database3 && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Database 3:</span>
                                <p className="text-gray-900 break-all">{detail.database3}</p>
                              </div>
                            )}

                            {detail.soap && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">SOAP:</span>
                                <p className="text-gray-900 break-all">{detail.soap}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No environment details found for this service.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingQuickActions;