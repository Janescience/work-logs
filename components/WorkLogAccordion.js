// src/components/WorkLogAccordion.js
import React from 'react';
import JiraItem from '@/components/JiraItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import useAccordion from '@/hooks/useAccordion';

function WorkLogAccordion({ 
  currentView, 
  grouped, 
  monthUsedHours, 
  monthCapacities, 
  logOptions, 
  onAddLog, 
  onEditJira, 
  onDeleteJira, 
  fetchJiras,
  updateOptimisticJira,
  rollbackOptimisticJiraUpdate,
  deleteOptimisticJira,
  rollbackOptimisticJiraDelete,
  updateOptimisticLog,
  rollbackOptimisticLogUpdate,
  deleteOptimisticLog,
  rollbackOptimisticLogDelete,
  externalStatuses // *** NEW PROP: รับสถานะทั้งหมดเข้ามา ***
}) {
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
  const defaultExpandedMonthKey = `${currentYear}-${currentMonthName}`;

  const [expandedYear, toggleYear] = useAccordion(currentView === 'project' || currentView === 'service' || currentView === 'environment' ? { [currentYear]: true } : {});
  const [expandedMonth, toggleMonth] = useAccordion(currentView === 'project' || currentView === 'service' || currentView === 'environment' ? { [defaultExpandedMonthKey]: true } : {});
  const [expandedProject, toggleProject] = useAccordion({});
  const [expandedService, toggleService] = useAccordion({});
  const [expandedMonthChronological, toggleMonthChronological] = useAccordion(currentView === 'jira' ? { [defaultExpandedMonthKey]: true } : {});
  const [expandedEnvironment, toggleEnvironment] = useAccordion({});

  // --- Helper function to render JiraItem with the external status ---
  const renderJiraItem = (jira) => (
    <JiraItem
      key={jira._id?.$oid || jira._id}
      jira={jira}
      logOptions={logOptions}
      onAddLog={onAddLog}
      onEditJira={onEditJira}
      onDeleteJira={onDeleteJira}
      fetchJiras={fetchJiras}
      updateOptimisticJira={updateOptimisticJira}
      rollbackOptimisticJiraUpdate={rollbackOptimisticJiraUpdate}
      deleteOptimisticJira={deleteOptimisticJira}
      rollbackOptimisticJiraDelete={rollbackOptimisticJiraDelete}
      updateOptimisticLog={updateOptimisticLog}
      rollbackOptimisticLogUpdate={rollbackOptimisticLogUpdate}
      deleteOptimisticLog={deleteOptimisticLog}
      rollbackOptimisticLogDelete={rollbackOptimisticLogDelete}
      // *** PASS THE SPECIFIC STATUS DOWN TO THE CHILD ***
      externalStatus={externalStatuses[jira.jiraNumber]} 
    />
  );

  return (
    <div className="p-4 border border-gray-300  overflow-hidden" id="workLogAccordion">
      {/* --- Project View --- */}
      {currentView === 'project' && Object.entries(grouped).map(([year, months]) => (
        <div key={year} className=" bg-white">
          <button className="w-full text-left px-3 py-3  bg-white hover:bg-gray-100 text-black" type="button" onClick={() => toggleYear(year)}>
            <span className="flex items-center justify-between">
              <span>{year}</span>
              <FontAwesomeIcon icon={expandedYear[year] ? faChevronUp : faChevronDown} className="text-black" />
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${expandedYear[year] ? 'h-auto' : 'h-0'}`}>
            <div className="bg-white">
              {Object.entries(months).map(([month, projectList]) => {
                const monthKey = `${year}-${month}`;
                return (
                  <div key={month} className="border-t border-gray-200 bg-white">
                    <button className="w-full text-left px-3 py-2 font-normal bg-white hover:bg-gray-100 text-black " type="button" onClick={() => toggleMonth(monthKey)}>
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-3 ml-5">
                          {month}
                          <span className="px-2 py-1 text-sm text-gray-500  bg-white border border-gray-300">
                            Used: {monthUsedHours[monthKey] || 0}
                          </span>
                          <span className="px-2 py-1 text-sm text-gray-500  bg-white border border-gray-300">
                            Capacity: {monthCapacities[monthKey] || 0}
                          </span>
                          <span className="px-2 py-1 text-sm text-gray-500  bg-white border border-gray-300">
                            Gap: {(monthCapacities[monthKey] - (monthUsedHours[monthKey] || 0)) || 0}
                          </span>
                        </span>
                        <FontAwesomeIcon icon={expandedMonth[monthKey] ? faChevronUp : faChevronDown} className="text-black" />
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${expandedMonth[monthKey] ? 'h-auto' : 'h-0'}`}>
                      <div className="bg-white">
                        {projectList.map(project => (
                          <div key={project.id} className="border-t border-gray-200 bg-white">
                            <button className="w-full text-left px-3 py-2 font-normal bg-white hover:bg-gray-100 text-black" type="button" onClick={() => toggleProject(`${monthKey}-${project.id}`)}>
                              <span className="flex items-center justify-between">
                                <span className="flex items-center gap-2 ml-10">
                                  {project.name}
                                  {project.totalHoursForMonth > 0 && (
                                    <span className="px-2 py-1 text-xs text-black bg-white border border-gray-300">
                                      Total: {project.totalHoursForMonth}
                                    </span>
                                  )}
                                </span>
                                <FontAwesomeIcon icon={expandedProject[`${monthKey}-${project.id}`] ? faChevronUp : faChevronDown} className="text-black" />
                              </span>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${expandedProject[`${monthKey}-${project.id}`] ? 'h-auto' : 'h-0'}`}>
                              <div className="bg-white border-t border-gray-200">
                                {project.jiras.map(renderJiraItem)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* --- Service View --- */}
      {currentView === 'service' && Object.entries(grouped).map(([year, months]) => (
        <div key={year} className="border border-gray-200 bg-white">
          <button className="w-full text-left px-3 py-2 font-medium bg-white hover:bg-gray-100 text-black border-b border-gray-200" type="button" onClick={() => toggleYear(year)}>
            <span className="flex items-center justify-between">
              <span>{year}</span>
              <FontAwesomeIcon icon={expandedYear[year] ? faChevronUp : faChevronDown} className="text-black" />
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${expandedYear[year] ? 'h-auto' : 'h-0'}`}>
            <div className="bg-white">
              {Object.entries(months).map(([month, serviceList]) => {
                const monthKey = `${year}-${month}`;
                return (
                  <div key={month} className="border-t border-gray-200 bg-white">
                    <button className="w-full text-left px-3 py-2 font-normal bg-white hover:bg-gray-100 text-black border-b border-gray-200" type="button" onClick={() => toggleMonth(monthKey)}>
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-3 ml-5">
                          {month}
                          <span className="px-2 py-1 text-xs text-black bg-white border border-gray-300">
                            Used: {monthUsedHours[monthKey] || 0}
                          </span>
                          <span className="px-2 py-1 text-xs text-black bg-white border border-gray-300">
                            Capacity: {monthCapacities[monthKey] || 0}
                          </span>
                          <span className="px-2 py-1 text-xs text-black bg-white border border-gray-300">
                            Gap: {(monthCapacities[monthKey] - (monthUsedHours[monthKey] || 0)) || 0}
                          </span>
                        </span>
                        <FontAwesomeIcon icon={expandedMonth[monthKey] ? faChevronUp : faChevronDown} className="text-black" />
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${expandedMonth[monthKey] ? 'h-auto' : 'h-0'}`}>
                      <div className="bg-white">
                        {serviceList.map(service => (
                          <div key={service.id} className="border-t border-gray-200 bg-white">
                            <button className="w-full text-left px-3 py-2 font-normal bg-white hover:bg-gray-100 text-black" type="button" onClick={() => toggleService(`${monthKey}-${service.id}`)}>
                              <span className="flex items-center justify-between">
                                <span className="flex items-center gap-2 ml-10">
                                  {service.name}
                                  {service.totalHoursForMonth && (
                                    <span className="px-2 py-1 text-xs text-black bg-white border border-gray-300">
                                      Total: {service.totalHoursForMonth.toFixed(2)}
                                    </span>
                                  )}
                                </span>
                                <FontAwesomeIcon icon={expandedService[`${monthKey}-${service.id}`] ? faChevronUp : faChevronDown} className="text-black" />
                              </span>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${expandedService[`${monthKey}-${service.id}`] ? 'h-auto' : 'h-0'}`}>
                              <div className="bg-white border-t border-gray-200">
                                {service.jiras.map(renderJiraItem)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* --- Jira  View --- */}
      {currentView === 'jira' && Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([yearMonthKey, monthData]) => (
        <div key={yearMonthKey} className="border border-gray-200 bg-black">
          <button className="w-full text-left px-3 py-2 font-medium bg-black hover:bg-gray-800 text-white border-b border-gray-600" type="button" onClick={() => toggleMonthChronological(yearMonthKey)}>
            <span className="flex items-center justify-between">
              <span>{yearMonthKey}</span>
              <FontAwesomeIcon icon={expandedMonthChronological[yearMonthKey] ? faChevronUp : faChevronDown} className="text-white" />
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ${expandedMonthChronological[yearMonthKey] ? 'h-auto' : 'h-0'}`}>
            <div className="bg-black">
              {monthData.jiras.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(renderJiraItem)}
            </div>
          </div>
        </div>
      ))}
      
    </div>
  );
}

export default WorkLogAccordion;