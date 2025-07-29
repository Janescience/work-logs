import { useMemo } from 'react';

/**
 * Custom hook for calculating statistics from data
 * @param {Array} data - Array of data to calculate statistics from
 * @param {Object} calculators - Object with calculator functions
 * @returns {Object} Calculated statistics
 */
const useStats = (data = [], calculators = {}) => {
  return useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      // Return empty stats object with default values
      const emptyStats = {};
      Object.keys(calculators).forEach(key => {
        emptyStats[key] = 0;
      });
      return emptyStats;
    }

    const stats = {};
    
    Object.entries(calculators).forEach(([key, calculator]) => {
      if (typeof calculator === 'function') {
        try {
          stats[key] = calculator(data);
        } catch (error) {
          console.error(`Error calculating stat "${key}":`, error);
          stats[key] = 0;
        }
      }
    });
    
    return stats;
  }, [data, calculators]);
};

/**
 * Hook for common JIRA statistics
 * @param {Array} jiras - Array of JIRA items
 * @returns {Object} Calculated JIRA statistics
 */
export const useJiraStats = (jiras = []) => {
  const calculators = {
    totalTasks: (data) => data.length,
    
    completedTasks: (data) => {
      return data.filter(jira => 
        (jira.actualStatus || '').toLowerCase() === 'done'
      ).length;
    },
    
    inProgressTasks: (data) => {
      return data.filter(jira => 
        (jira.actualStatus || '').toLowerCase() === 'in progress'
      ).length;
    },
    
    todoTasks: (data) => {
      return data.filter(jira => {
        const status = (jira.actualStatus || '').toLowerCase();
        return status === 'to do' || status === 'open';
      }).length;
    },
    
    blockedTasks: (data) => {
      return data.filter(jira => {
        const status = (jira.actualStatus || '').toLowerCase();
        return status === 'blocked' || status === 'impediment';
      }).length;
    },
    
    overdueTasks: (data) => {
      const now = new Date();
      return data.filter(jira => {
        const dueDate = new Date(jira.dueDate);
        const status = (jira.actualStatus || '').toLowerCase();
        return dueDate < now && status !== 'done';
      }).length;
    },
    
    totalHours: (data) => {
      return data.reduce((total, jira) => {
        return total + parseFloat(jira.totalTimeSpent || 0);
      }, 0);
    },
    
    averageHoursPerTask: (data) => {
      if (data.length === 0) return 0;
      const totalHours = data.reduce((total, jira) => {
        return total + parseFloat(jira.totalTimeSpent || 0);
      }, 0);
      return totalHours / data.length;
    },
    
    completionRate: (data) => {
      if (data.length === 0) return 0;
      const completed = data.filter(jira => 
        (jira.actualStatus || '').toLowerCase() === 'done'
      ).length;
      return Math.round((completed / data.length) * 100);
    },
    
    highPriorityTasks: (data) => {
      return data.filter(jira => {
        const priority = (jira.priority || '').toLowerCase();
        return priority === 'high' || priority === 'critical' || priority === 'highest';
      }).length;
    },
    
    projectCount: (data) => {
      const projects = new Set();
      data.forEach(jira => {
        if (jira.projectName) {
          projects.add(jira.projectName);
        }
      });
      return projects.size;
    },
    
    thisMonthTasks: (data) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      return data.filter(jira => {
        const createdDate = new Date(jira.createdAt);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length;
    },
    
    thisMonthHours: (data) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      return data.reduce((total, jira) => {
        if (!jira.dailyLogs) return total;
        
        const monthHours = jira.dailyLogs
          .filter(log => {
            const logDate = new Date(log.logDate);
            return logDate.getMonth() === currentMonth && 
                   logDate.getFullYear() === currentYear;
          })
          .reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
        
        return total + monthHours;
      }, 0);
    },
    
    monthHours: (data) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      return data.reduce((total, jira) => {
        if (!jira.dailyLogs) return total;
        
        const monthHours = jira.dailyLogs
          .filter(log => {
            const logDate = new Date(log.logDate);
            return logDate.getMonth() === currentMonth && 
                   logDate.getFullYear() === currentYear;
          })
          .reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
        
        return total + monthHours;
      }, 0);
    },
    
    todayHours: (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return data.reduce((total, jira) => {
        if (!jira.dailyLogs) return total;
        
        const todayHours = jira.dailyLogs
          .filter(log => {
            const logDate = new Date(log.logDate);
            return logDate >= today && logDate < tomorrow;
          })
          .reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
        
        return total + todayHours;
      }, 0);
    },
    
    weekHours: (data) => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      return data.reduce((total, jira) => {
        if (!jira.dailyLogs) return total;
        
        const weekHours = jira.dailyLogs
          .filter(log => {
            const logDate = new Date(log.logDate);
            return logDate >= startOfWeek && logDate < endOfWeek;
          })
          .reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
        
        return total + weekHours;
      }, 0);
    },
    
    activeCount: (data) => {
      return data.filter(jira => {
        const status = (jira.actualStatus || '').toLowerCase();
        return status !== 'done' && status !== 'closed';
      }).length;
    },
    
    doneCount: (data) => {
      return data.filter(jira => 
        (jira.actualStatus || '').toLowerCase() === 'done'
      ).length;
    }
  };

  return useStats(jiras, calculators);
};

/**
 * Hook for team member statistics
 * @param {Array} members - Array of team members with their data
 * @returns {Object} Calculated team statistics
 */
export const useTeamStats = (members = []) => {
  const calculators = {
    totalMembers: (data) => data.length,
    
    coreMembers: (data) => {
      return data.filter(member => 
        member.user?.type === 'Core'
      ).length;
    },
    
    nonCoreMembers: (data) => {
      return data.filter(member => 
        member.user?.type === 'Non-Core'
      ).length;
    },
    
    totalHours: (data) => {
      return data.reduce((total, member) => {
        return total + parseFloat(member.totalHours || 0);
      }, 0);
    },
    
    averageHoursPerMember: (data) => {
      if (data.length === 0) return 0;
      const totalHours = data.reduce((total, member) => {
        return total + parseFloat(member.totalHours || 0);
      }, 0);
      return totalHours / data.length;
    },
    
    utilizationRate: (data) => {
      if (data.length === 0) return 0;
      const capacity = data.length * 22 * 8; // Assuming 22 working days, 8 hours each
      const totalHours = data.reduce((total, member) => {
        return total + parseFloat(member.totalHours || 0);
      }, 0);
      return (totalHours / capacity) * 100;
    },
    
    highPerformers: (data) => {
      return data.filter(member => {
        const memberCapacity = 22 * 8;
        const utilization = ((member.totalHours || 0) / memberCapacity) * 100;
        return utilization >= 80;
      }).length;
    },
    
    underutilized: (data) => {
      return data.filter(member => {
        const memberCapacity = 22 * 8;
        const utilization = ((member.totalHours || 0) / memberCapacity) * 100;
        return utilization < 50;
      }).length;
    },
    
    activeMembers: (data) => {
      return data.filter(member => 
        (member.totalHours || 0) > 0
      ).length;
    },
    
    inactiveMembers: (data) => {
      return data.filter(member => 
        (member.totalHours || 0) === 0
      ).length;
    }
  };

  return useStats(members, calculators);
};

/**
 * Hook for project statistics
 * @param {Array} projects - Array of projects with their data
 * @returns {Object} Calculated project statistics
 */
export const useProjectStats = (projects = []) => {
  const calculators = {
    totalProjects: (data) => data.length,
    
    activeProjects: (data) => {
      return data.filter(project => 
        project.status === 'active' || project.status === 'in-progress'
      ).length;
    },
    
    completedProjects: (data) => {
      return data.filter(project => 
        project.status === 'completed' || project.status === 'done'
      ).length;
    },
    
    totalBudget: (data) => {
      return data.reduce((total, project) => {
        return total + parseFloat(project.budget || 0);
      }, 0);
    },
    
    averageBudget: (data) => {
      if (data.length === 0) return 0;
      const totalBudget = data.reduce((total, project) => {
        return total + parseFloat(project.budget || 0);
      }, 0);
      return totalBudget / data.length;
    },
    
    overBudgetProjects: (data) => {
      return data.filter(project => {
        const budget = parseFloat(project.budget || 0);
        const spent = parseFloat(project.actualCost || 0);
        return spent > budget && budget > 0;
      }).length;
    },
    
    onTimeProjects: (data) => {
      const now = new Date();
      return data.filter(project => {
        const dueDate = new Date(project.dueDate);
        const status = project.status || '';
        return (status === 'completed' && dueDate >= now) || 
               (status !== 'completed' && dueDate >= now);
      }).length;
    }
  };

  return useStats(projects, calculators);
};

export default useStats;