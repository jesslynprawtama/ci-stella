import { useState, useEffect, useRef } from 'react';
import { FileDown, Printer, Plus, X, Check, Clock, Copy, ArrowUp, ArrowDown, ArrowUpDown, Save, ListCollapse } from 'lucide-react';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface MonthlyProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface Task {
  id: string;
  name: string;
  progress: number;
  notes: string;
  category: string;
  completedDate?: string;
  monthlyProgress?: Record<string, MonthlyProgress>;
  currentCompleted?: number;
  currentTotal?: number;
  additionalNotes?: string;
  order?: number;
  showHighlight?: boolean;
}

interface StoredData {
  completedTasks: Task[];
  inProgressTasks: Task[];
  totalVendors?: string;
  activeVendors?: string;
  vendorsProcessed?: string;
  additionalNotes?: string;
}

const COMPLETED_TASKS_TEMPLATE = [
  {
    category: 'Data Standardization',
    name: 'Rechecking Blank Default Payment Terms for Existing Active Suppliers',
    notes: 'Completed mapping of all blank payment terms in the database (Rechecking Blank Payment Term for Active Suppliers)\n- Shipment\'s: Done 27/1/2026\n- Buyer\'s: Done 18/3/2026',
    completedDate: '2026-03-18',
    additionalNotes: '- For New Vendor, it is now mandatory to fill in Default Payment Term (confirm buyer by WA, soon will be applied to New Registration Form)\n- PO/WO can\'t be saved if Payment Term is totally blank (detected from 3 fields)',
    order: 0,
    showHighlight: false,
  },
  {
    category: 'Figma (New LOCAL Registration Form)',
    name: 'Creating New Registration Form for LOCAL Vendors',
    notes: 'Editing and improving registration process for local vendors',
    completedDate: '2026-03-11',
    additionalNotes: 'Submitted to IT Team',
    order: 1,
    showHighlight: true,
  },
  {
    category: 'Data Cleanup',
    name: 'Correcting Email and Website Field Mix-ups',
    notes: 'Eliminated instances where websites were entered in email fields and vice versa. Registration form now includes validation to prevent this issue',
    completedDate: '2026-02-25',
    additionalNotes: 'Form validation now enforces correct email and website formats, preventing future mix-ups',
    order: 2,
    showHighlight: false,
  },
  {
    category: 'Data Cleanup',
    name: 'Removing Invalid Internal Email Addresses',
    notes: 'Deleted internal placeholder emails (e.g., no_send@email.com) from vendor records. New registration form now validates and prevents such entries',
    completedDate: '2026-02-20',
    additionalNotes: 'New registration form validation prevents invalid email entries automatically by detecting:\n- There should be @ and . as valid format for email\n- Invalid Notification for internal email address (e.g., no_send@email.com)',
    order: 3,
    showHighlight: false,
  },
  {
    category: 'Data Quality - Inactive Vendors',
    name: 'Fixing Address Based on New Rules for Inactive Suppliers',
    notes: 'Applying standardized address rules to inactive vendor records',
    completedDate: '2026-03-27',
    additionalNotes: '- Total Inactive Suppliers: 5232 Suppliers\n- Fixing only those with Address: 1798 Suppliers\n- Other Inactive Suppliers with No Address, will be updated if Buyer needs to order and Vendor must fill in Registration Form',
    order: 4,
    showHighlight: true,
  },
  {
    category: 'Database Maintenance',
    name: 'Disabling Vendors with no transactions for more than 3 years (since 2023)',
    notes: 'Disabled vendors with no transactions for more than 3 years (since 2023)',
    completedDate: '2025-11-25',
    additionalNotes: 'Will be checked periodically',
    order: 5,
    showHighlight: false,
  },
  {
    category: 'System Configuration',
    name: 'Mapping Supplier Types and Requesting New Types',
    notes: 'Requested and configured new supplier types to IT Team including REIMBURSE type (purchasing admin only access), ACCOUNTING type, etc.\nThese types affect permission/access control in PO creation',
    completedDate: '2025-12-04',
    order: 6,
    showHighlight: false,
  },
  {
    category: 'Data Quality - Active Vendors',
    name: 'Fixing Address Based on New Rules for Active Suppliers',
    notes: 'Standardized addresses for active suppliers according to new rules.\nNote: City and Country verification still pending (low priority)',
    completedDate: '2026-01-22',
    additionalNotes: 'On the New Registration Form, the Address will be more detailed and mandatory filled',
    order: 7,
    showHighlight: false,
  },
  {
    category: 'Data Quality - Active Vendors',
    name: 'Fixing Phone and Mobile Numbers for Active Suppliers',
    notes: 'Standardized phone and mobile numbers for active suppliers according to new rules.\nNote: Final verification still pending (low priority)',
    completedDate: '2025-11-21',
    additionalNotes: 'On the New Registration Form, the Format will be auto whenever vendor fills in the data (including country code, area code for Local/Indonesia, and format depends on number digits)',
    order: 8,
    showHighlight: false,
  },
  {
    category: 'Database Synchronization',
    name: 'Syncing Vendor Names Between MJS and WSI Databases (Old Data)',
    notes: 'Aligned vendor names across both databases to ensure consistency for VLOOKUP formulas when IT team injects information from Excel to Database/System',
    completedDate: '2025-12-19',
    additionalNotes: '- Fixing Old/Existing Vendors which were created by different PIC before\n- Currently, for New Vendor -- the Data will be copy paste exactly the same from MJS to WSI',
    order: 9,
    showHighlight: false,
  },
  {
    category: 'System Configuration',
    name: 'Requested WSI-X FLAG for Database Differentiation',
    notes: 'Implemented FLAG system to identify vendors existing only in MJS database but not in WSI.\nThis prevents VLOOKUP N/A errors during IT injection process.\nFocus remains on MJS for exports, with synchronized injection to both MJS and WSI (where vendor exists)',
    completedDate: '2025-12-17',
    additionalNotes: '- All Purchasing and Shipment Vendors will be created both on WSI and MJS\n- Excluding some vendors created by other PIC such as Belawan, Accounting Team, etc.',
    order: 10,
    showHighlight: false,
  },
  {
    category: 'Documentation',
    name: 'Created Comprehensive Data Rules and Guidelines',
    notes: 'Established standardized rules for Supplier\'s:\n- Name\n- Address\n- Phone / Mobile Number\n- Type\n- NPWP\n- City, Country, Currency\n- Delivery Term\n- Flags',
    completedDate: '2026-03-05',
    additionalNotes: 'Ongoing for other Rules / Guidelines',
    order: 11,
    showHighlight: false,
  },
];

const IN_PROGRESS_TASKS_TEMPLATE = [
  {
    category: 'Figma (New OVERSEAS Registration Form)',
    name: 'Creating New Registration Form for OVERSEAS Vendors',
    notes: 'Editing and improving registration process for overseas vendors',
    currentCompleted: 30,
    currentTotal: 100,
    additionalNotes: 'In Progress',
    order: 0,
  },
  {
    category: 'AI Integration',
    name: 'Extracting NPWP Information with AI',
    notes: 'Using AI to extract NPWP data from attachments/documents into database text fields.\nRequires verification to ensure accuracy',
    currentCompleted: 1212,
    currentTotal: 10308,
    additionalNotes: 'Total Existing Vendor for NPWP completion : To be Advised (not all Vendors have NPWP attachment)',
    order: 1,
  },
  {
    category: 'Data Quality',
    name: 'Fixing Supplier Names Based on New Rules',
    notes: 'Reviewing and correcting supplier names based on location, stamps, invoices, and bank account holder information.\nChecking for duplicate vendors and determining which vendor codes should be disabled',
    currentCompleted: 1977,
    currentTotal: 10308,
    additionalNotes: 'Estimated progress since October 2025 (specific Audit Trail for Editing Supplier Name field, can\'t be exported into file)',
    order: 2,
  },
  {
    category: 'Reporting',
    name: 'Requesting Comprehensive Supplier Contact Report',
    notes: 'Working on clean report with complete information for 3 main contacts:\n(1) Inquiry email and WhatsApp\n(2) Send PO/WO email and WhatsApp\n(3) Invoice checking email and WhatsApp',
    currentCompleted: 80,
    currentTotal: 100,
    additionalNotes: 'In Progress by IT Team\n- Contact for AutoSend PO/WO: should on display number under "WA" Title specifically',
    order: 3,
  },
  {
    category: 'Vendor Relationships',
    name: 'Properties / Remarks for Related Vendors',
    notes: 'Documenting vendor relationships in Properties Field (e.g., REZEKI MAKMUR for non-tax, CHAINTRACO MAKMUR CV for tax).\nThis information will be available when data is exported for other departments',
    currentCompleted: 114,
    currentTotal: 149,
    additionalNotes: 'On the New Registration Form, Buyer should fill in whether it is related to Existing Vendor in Database, including reason as remarks and if the Existing Vendor should be disabled',
    order: 4,
  },
  {
    category: 'Data Standardization',
    name: 'Rechecking Blank Default PPH Info for Existing Active Suppliers',
    notes: 'Mapping based on History',
    currentCompleted: 10,
    currentTotal: 275,
    additionalNotes: 'For New Vendor, it is now mandatory to fill in Default PPH Info if it is Work Order (confirm buyer by WA, soon will be applied to New Registration Form)',
    order: 5,
  },
  {
    category: 'Financial Data',
    name: 'Completing Bank Account Details with Cashier Team',
    notes: 'Working with Cashier Team to complete bank account information (they previously used a different ERP system)',
    currentCompleted: 270,
    currentTotal: 10308,
    order: 6,
  },
  {
    category: 'Compliance',
    name: 'Following Up on Vendor Registration Forms',
    notes: 'Contacting buyers to follow up with vendors registered before 2021 who have not completed the vendor registration form (procedure implemented around 2021)',
    currentCompleted: 3729,
    currentTotal: 5076,
    order: 7,
  },
  {
    category: 'Data Migration',
    name: 'Saving PDF Backups from Existing Supplier Web',
    notes: 'Creating PDF backups before migrating to new web system to prevent data loss if old system becomes inaccessible',
    currentCompleted: 1439,
    currentTotal: 4687,
    order: 8,
  },
  {
    category: 'Data Standardization',
    name: 'Capitalizing All Database Information',
    notes: 'Converting all database entries to uppercase for consistency and professional appearance',
    currentCompleted: 70,
    currentTotal: 100,
    additionalNotes: 'Rechecking All Fields',
    order: 9,
  },
  {
    category: 'Data Quality - Inactive Vendors',
    name: 'Fixing Phone and Mobile Numbers for Inactive Suppliers',
    notes: 'Applying standardized phone number formatting to inactive vendor records',
    currentCompleted: 0,
    currentTotal: 3874,
    additionalNotes: '- Total Inactive Suppliers: 5232 Suppliers\n- Fixing only those with Phone / Mobile Number : 3874 Suppliers\n- Other Inactive Suppliers with No Phone / Mobile Number, will be updated if Buyer needs to order and Vendor must fill in Registration Form',
    order: 10,
  },
  {
    category: 'Data Verification',
    name: 'Rechecking City, State, Country Accuracy',
    notes: 'Verifying geographical information against addresses and other data.\nLower priority item to ensure complete vendor information',
    currentCompleted: 0,
    currentTotal: 0,
    additionalNotes: 'Pending',
    order: 11,
  },
  {
    category: 'Duplicate Detection',
    name: 'Identifying Related Vendors',
    notes: 'Checking for vendor relationships based on matching email domains, phone numbers, addresses, and websites.\nImplemented mandatory field in registration form requiring buyers to indicate if vendor is new or related to existing vendor with reason/remarks',
    currentCompleted: 0,
    currentTotal: 0,
    additionalNotes: 'Pending',
    order: 12,
  },
  {
    category: 'Database Synchronization',
    name: 'Completing Default Delivery Terms in WSI',
    notes: 'IT Team fixing incomplete Default Delivery term list in WSI compared to MJS.\nWill map and inject complete delivery terms from MJS to WSI once main list is complete',
    currentCompleted: 0,
    currentTotal: 0,
    additionalNotes: 'In Progress by IT Team before injecting Data',
    order: 13,
  },
];

// Month colors for progress bars
const MONTH_COLORS: Record<string, string> = {
  'January': '#ef4444',     // red-500
  'February': '#f97316',    // orange-500
  'March': '#f59e0b',       // amber-500
  'April': '#84cc16',       // lime-500
  'May': '#22c55e',         // green-500
  'June': '#10b981',        // emerald-500
  'July': '#14b8a6',        // teal-500
  'August': '#06b6d4',      // cyan-500
  'September': '#0ea5e9',   // sky-500
  'October': '#3b82f6',     // blue-500
  'November': '#8b5cf6',    // violet-500
  'December': '#a855f7',    // purple-500
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthlyReport() {
  const currentYear = new Date().getFullYear();
  const currentMonth = format(new Date(), 'MMMM');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear.toString());
  const [totalVendors, setTotalVendors] = useState('10308');
  const [activeVendors, setActiveVendors] = useState('');
  const [inactiveVendors, setInactiveVendors] = useState('');
  const [vendorsProcessed, setVendorsProcessed] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>([]);
  
  const [showPreview, setShowPreview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [completedSortOrder, setCompletedSortOrder] = useState<'asc' | 'desc' | 'custom'>('custom');
  const [progressSortOrder, setProgressSortOrder] = useState<'asc' | 'desc' | 'custom'>('custom');

  // Get storage key for specific month/year
  const getStorageKey = (m: string, y: string) => {
    const monthIndex = MONTH_NAMES.indexOf(m);
    return `vendor-report-data-${y}-${String(monthIndex + 1).padStart(2, '0')}`;
  };

  const getCurrentMonthKey = () => {
    const monthIndex = MONTH_NAMES.indexOf(month);
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  };

  // Get previous month data
  const getPreviousMonthData = () => {
    const monthIndex = MONTH_NAMES.indexOf(month);
    
    let prevMonth = monthIndex - 1;
    let prevYear = parseInt(year);
    
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    
    const prevMonthName = MONTH_NAMES[prevMonth];
    const prevStorageKey = getStorageKey(prevMonthName, prevYear.toString());
    const savedData = localStorage.getItem(prevStorageKey);
    
    if (savedData) {
      try {
        const parsed: StoredData = JSON.parse(savedData);
        const prevTotalVendors = parsed.totalVendors || '';
        const prevActiveVendors = parsed.activeVendors || '';
        const prevInactive = (prevTotalVendors && prevActiveVendors)
          ? (parseInt(prevTotalVendors) - parseInt(prevActiveVendors)).toString()
          : '';
        return {
          monthName: prevMonthName,
          year: prevYear,
          totalVendors: prevTotalVendors,
          activeVendors: prevActiveVendors,
          inactiveVendors: prevInactive,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  /**
   * Collect monthly progress history for a given task by scanning all saved months
   * up to (and including) the current report month. This merges progress entries
   * from earlier months so the progress bar can show multi-month segments.
   */
  const collectMonthlyProgressForTask = (taskName: string, currentMonthKey: string): Record<string, MonthlyProgress> => {
    const allProgress: Record<string, MonthlyProgress> = {};
    
    // Parse current month key
    const [curYear, curMonth] = currentMonthKey.split('-').map(Number);
    
    // Scan forward through all 24 months (current + previous 23 months) to find progress history
    for (let i = 23; i >= 0; i--) {
      let scanMonth = curMonth - i;
      let scanYear = curYear;
      
      // Normalize month/year (handle year boundaries)
      while (scanMonth <= 0) {
        scanMonth += 12;
        scanYear -= 1;
      }
      
      const scanMonthKey = `${scanYear}-${String(scanMonth).padStart(2, '0')}`;
      const scanMonthName = MONTH_NAMES[scanMonth - 1];
      const storageKey = getStorageKey(scanMonthName, scanYear.toString());
      
      // Don't scan beyond the current report month
      if (scanMonthKey > currentMonthKey) continue;
      
      // Skip if we've already found this month's data
      if (allProgress[scanMonthKey]) continue;
      
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed: StoredData = JSON.parse(savedData);
          // Search for matching task in in-progress tasks by exact name match
          const matchingTask = parsed.inProgressTasks.find(t => t.name === taskName);
          if (matchingTask) {
            // First priority: check explicit monthlyProgress entries
            if (matchingTask.monthlyProgress && matchingTask.monthlyProgress[scanMonthKey]) {
              allProgress[scanMonthKey] = matchingTask.monthlyProgress[scanMonthKey];
            }
            // Second priority: use currentCompleted/currentTotal if available and not already added
            else if (!allProgress[scanMonthKey] && matchingTask.currentCompleted !== undefined && matchingTask.currentTotal !== undefined && matchingTask.currentTotal > 0) {
              const completed = parseInt(String(matchingTask.currentCompleted)) || 0;
              const total = parseInt(String(matchingTask.currentTotal)) || 0;
              if (total > 0) {
                allProgress[scanMonthKey] = {
                  completed: completed,
                  total: total,
                  percentage: Math.round((completed / total) * 100),
                };
              }
            }
          }
        } catch (e) {
          console.warn(`Error parsing data for ${scanMonthName} ${scanYear}:`, e);
        }
      }
    }
    
    return allProgress;
  };

  // Load saved data for selected month/year
  useEffect(() => {
    const storageKey = getStorageKey(month, year);
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsed: StoredData = JSON.parse(savedData);
        setCompletedTasks(parsed.completedTasks.sort((a, b) => (a.order || 0) - (b.order || 0)));
        
        // When loading in-progress tasks, also collect their monthly progress history from previous months
        const inProgressWithHistory = parsed.inProgressTasks.map(task => {
          const currentMonthKey = `${year}-${String(MONTH_NAMES.indexOf(month) + 1).padStart(2, '0')}`;
          const collectedProgress = collectMonthlyProgressForTask(task.name, currentMonthKey);
          
          return {
            ...task,
            monthlyProgress: {
              ...collectedProgress,
              ...(task.monthlyProgress || {}), // preserve any existing monthlyProgress
            },
          };
        });
        
        setInProgressTasks(inProgressWithHistory.sort((a, b) => (a.order || 0) - (b.order || 0)));
        setTotalVendors(parsed.totalVendors || '10308');
        setActiveVendors(parsed.activeVendors || (month === 'March' && year === '2026' ? '5076' : ''));
        setVendorsProcessed(parsed.vendorsProcessed || '');
        setAdditionalNotes(parsed.additionalNotes || '');
      } catch (e) {
        console.error('Error loading saved data:', e);
        initializeTemplateData();
      }
    } else {
      // Initialize with template data for new months
      initializeTemplateData();
    }
  }, [month, year]);

  // Notify App.tsx when month/year changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('monthYearChanged', { detail: { month, year, totalVendors } }));
  }, [month, year, totalVendors]);

  const initializeTemplateData = () => {
    const currentMonthKey = getCurrentMonthKey();
    
    // For in-progress tasks, collect their monthly progress history
    const completedTasksWithData = COMPLETED_TASKS_TEMPLATE.map((task, index) => ({
      id: `completed-${index}`,
      ...task,
      progress: 100,
      monthlyProgress: {},
    }));
    
    const inProgressTasksWithData = IN_PROGRESS_TASKS_TEMPLATE.map((task, index) => {
      // Collect historical progress for this task from all previous months
      const collectedProgress = collectMonthlyProgressForTask(task.name, currentMonthKey);
      
      // Also calculate current month progress if available
      if (task.currentTotal && task.currentTotal > 0 && !collectedProgress[currentMonthKey]) {
        collectedProgress[currentMonthKey] = {
          completed: task.currentCompleted || 0,
          total: task.currentTotal,
          percentage: Math.round((((task.currentCompleted || 0) / task.currentTotal) || 0) * 100),
        };
      }
      
      return {
        id: `progress-${index}`,
        ...task,
        progress: task.currentTotal && task.currentTotal > 0 
          ? Math.round((task.currentCompleted! / task.currentTotal) * 100) 
          : 0,
        monthlyProgress: collectedProgress,
      };
    });
    
    setCompletedTasks(completedTasksWithData);
    setInProgressTasks(inProgressTasksWithData);
    
    // Set March 2026 defaults
    if (month === 'March' && year === '2026') {
      setActiveVendors('5076');
    }
  };

  // Auto-check highlight for tasks completed in current report month
  useEffect(() => {
    const currentMonthKey = getCurrentMonthKey();
    const [currentYear, currentMonthNum] = currentMonthKey.split('-');
    
    setCompletedTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.completedDate) {
          const [taskYear, taskMonth] = task.completedDate.split('-');
          const isCurrentMonth = taskYear === currentYear && taskMonth === currentMonthNum;
          // Auto-check if it's current month
          return { ...task, showHighlight: isCurrentMonth };
        }
        return task;
      })
    );
  }, [month, year]);

  // Save data permanently for the selected month
  const saveReportPermanently = () => {
    setIsSaving(true);
    
    const storageKey = getStorageKey(month, year);
    
    // Ensure all in-progress tasks have their monthly progress properly recorded
    const tasksWithMonthlyProgress = inProgressTasks.map(task => {
      const currentMonthKey = getCurrentMonthKey();
      
      // Ensure current month progress is in monthlyProgress
      if (task.currentCompleted !== undefined && task.currentTotal !== undefined && task.currentTotal > 0) {
        return {
          ...task,
          monthlyProgress: {
            ...(task.monthlyProgress || {}),
            [currentMonthKey]: {
              completed: task.currentCompleted,
              total: task.currentTotal,
              percentage: Math.round((task.currentCompleted / task.currentTotal) * 100),
            },
          },
        };
      }
      
      return task;
    });
    
    const dataToSave: StoredData = {
      completedTasks,
      inProgressTasks: tasksWithMonthlyProgress,
      totalVendors,
      activeVendors,
      vendorsProcessed,
      additionalNotes,
    };
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    
    // Dispatch custom event to notify other components (like App.tsx) about the data change
    window.dispatchEvent(new CustomEvent('vendorDataSaved', { detail: { totalVendors } }));
    
    // Also update the in-memory state to reflect saved data
    setInProgressTasks(tasksWithMonthlyProgress);
    
    setTimeout(() => {
      setIsSaving(false);
      alert(`✅ Changes saved permanently for ${month} ${year}!`);
    }, 500);
  };

  // Auto-move 100% complete tasks from in-progress to completed
  useEffect(() => {
    const completedProgressTasks = inProgressTasks.filter(t => t.progress === 100);
    
    if (completedProgressTasks.length > 0) {
      const tasksToMove = completedProgressTasks.map(t => ({
        ...t,
        id: `completed-moved-${t.id}`,
        completedDate: format(new Date(), 'yyyy-MM-dd'),
        order: -1000,
        showHighlight: true,
      }));
      
      const remainingProgress = inProgressTasks.filter(t => t.progress !== 100);
      const updatedCompleted = [...tasksToMove, ...completedTasks].map((t, idx) => ({
        ...t,
        order: idx,
      }));
      
      setInProgressTasks(remainingProgress.map((t, idx) => ({ ...t, order: idx })));
      setCompletedTasks(updatedCompleted);
    }
  }, [inProgressTasks.map(t => t.progress).join(',')]);

  // Auto-calculate inactive vendors
  useEffect(() => {
    if (totalVendors && activeVendors) {
      const inactive = parseInt(totalVendors) - parseInt(activeVendors);
      setInactiveVendors(inactive.toString());
    }
  }, [totalVendors, activeVendors]);

  const addTask = (type: 'completed' | 'inProgress') => {
    const tasks = type === 'completed' ? completedTasks : inProgressTasks;
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : -1;
    
    const newTask: Task = {
      id: `${type}-${Date.now()}`,
      name: '',
      progress: type === 'completed' ? 100 : 0,
      notes: '',
      category: '',
      monthlyProgress: {},
      currentCompleted: 0,
      currentTotal: 0,
      order: maxOrder + 1,
      showHighlight: false,
    };
    
    if (type === 'completed') {
      setCompletedTasks([...completedTasks, newTask]);
    } else {
      setInProgressTasks([...inProgressTasks, newTask]);
    }
  };

  const duplicateTask = (type: 'completed' | 'inProgress', task: Task) => {
    const tasks = type === 'completed' ? completedTasks : inProgressTasks;
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : -1;
    
    const duplicatedTask: Task = {
      ...task,
      id: `${type}-${Date.now()}`,
      order: maxOrder + 1,
    };
    
    const newTasks = [...tasks];
    newTasks.splice(taskIndex + 1, 0, duplicatedTask);
    
    if (type === 'completed') {
      setCompletedTasks(newTasks);
    } else {
      setInProgressTasks(newTasks);
    }
  };

  const removeTask = (type: 'completed' | 'inProgress', id: string) => {
    if (type === 'completed') {
      setCompletedTasks(completedTasks.filter(t => t.id !== id));
    } else {
      setInProgressTasks(inProgressTasks.filter(t => t.id !== id));
    }
  };

  const moveTask = (type: 'completed' | 'inProgress', id: string, direction: 'up' | 'down') => {
    const tasks = type === 'completed' ? completedTasks : inProgressTasks;
    const index = tasks.findIndex(t => t.id === id);
    
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tasks.length - 1)) {
      return;
    }
    
    const newTasks = [...tasks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
    
    newTasks.forEach((task, idx) => {
      task.order = idx;
    });
    
    if (type === 'completed') {
      setCompletedTasks(newTasks);
      setCompletedSortOrder('custom');
    } else {
      setInProgressTasks(newTasks);
      setProgressSortOrder('custom');
    }
  };

  const sortCompletedTasks = (order: 'asc' | 'desc') => {
    const sorted = [...completedTasks].sort((a, b) => {
      const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
      const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setCompletedTasks(sorted);
    setCompletedSortOrder(order);
  };

  const sortProgressTasks = (order: 'asc' | 'desc') => {
    const sorted = [...inProgressTasks].sort((a, b) => {
      return order === 'asc' ? a.progress - b.progress : b.progress - a.progress;
    });
    setInProgressTasks(sorted);
    setProgressSortOrder(order);
  };

  const updateTask = (type: 'completed' | 'inProgress', id: string, field: keyof Task, value: string | number | boolean) => {
    const updateFn = (tasks: Task[]) => 
      tasks.map(t => {
        if (t.id === id) {
          const updated = { ...t, [field]: value };
          
          if (type === 'inProgress' && (field === 'currentCompleted' || field === 'currentTotal')) {
            const completed = field === 'currentCompleted' ? Number(value) : (t.currentCompleted || 0);
            const total = field === 'currentTotal' ? Number(value) : (t.currentTotal || 0);
            
            if (total > 0) {
              updated.progress = Math.round((completed / total) * 100);
              
              const monthKey = getCurrentMonthKey();
              updated.monthlyProgress = {
                ...t.monthlyProgress,
                [monthKey]: {
                  completed,
                  total,
                  percentage: updated.progress,
                },
              };
            }
          }
          
          return updated;
        }
        return t;
      });
    
    if (type === 'completed') {
      setCompletedTasks(updateFn(completedTasks));
    } else {
      setInProgressTasks(updateFn(inProgressTasks));
    }
  };

  const copyVendorNumberToTask = (taskId: string, type: 'total' | 'active' | 'inactive') => {
    const value = type === 'total' ? totalVendors : type === 'active' ? activeVendors : inactiveVendors;
    if (value) {
      updateTask('inProgress', taskId, 'currentTotal', parseInt(value));
    }
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
    setShowSummary(false);
  };

  const handleGenerateSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(false);
    setShowSummary(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async (isSummaryView: boolean = false) => {
    const targetRef = isSummaryView ? summaryRef : reportRef;
    if (!targetRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const dataUrl = await toPng(targetRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);
      
      const imgWidth = contentWidth;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      const pageCount = Math.ceil(imgHeight / contentHeight);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      const pixelsPerPage = (contentHeight / imgWidth) * img.width;
      
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const sourceY = i * pixelsPerPage;
        const sourceHeight = Math.min(pixelsPerPage, img.height - sourceY);
        
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = img.width;
        pageCanvas.height = sourceHeight;
        
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0, sourceY,
            img.width, sourceHeight,
            0, 0,
            img.width, sourceHeight
          );
          
          const pageDataUrl = pageCanvas.toDataURL('image/png');
          const pageImgHeight = (sourceHeight / img.width) * imgWidth;
          
          pdf.addImage(
            pageDataUrl,
            'PNG',
            margin,
            margin,
            imgWidth,
            pageImgHeight
          );
        }
      }
      
      const suffix = isSummaryView ? '_Summary' : '';
      pdf.save(`Vendor_Database_Monthly_Report_${month}_${year}${suffix}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getProgressColor = (monthName: string) => {
    return MONTH_COLORS[monthName] || '#3b82f6';
  };

  // Get month name from monthKey like "2026-03"
  const getMonthName = (monthKey: string) => {
    const [, m] = monthKey.split('-');
    return MONTH_NAMES[parseInt(m) - 1];
  };

  // Helper to compute the change indicator string
  const computeChange = (current: string, previous: string): string | null => {
    if (!current || !previous) return null;
    const diff = parseInt(current) - parseInt(previous);
    if (isNaN(diff)) return null;
    if (diff === 0) return 'No change';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toLocaleString()} from prev. month`;
  };

  /**
   * Renders a vendor stats card with optional previous month comparison
   */
  const VendorStatCard = ({ label, value, color, prevValue, prevLabel }: {
    label: string;
    value: string;
    color: string;
    prevValue?: string;
    prevLabel?: string;
  }) => {
    const change = prevValue ? computeChange(value, prevValue) : null;
    const bgMap: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      gray: 'bg-gray-50 border-gray-200',
      purple: 'bg-purple-50 border-purple-200',
    };
    const textMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      gray: 'text-gray-600',
      purple: 'text-purple-600',
    };
    
    return (
      <div className={`p-4 rounded-lg border ${bgMap[color] || bgMap.blue}`}>
        <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
        <div className={`text-2xl font-bold ${textMap[color] || textMap.blue}`}>
          {parseInt(value).toLocaleString()}
        </div>
        {prevValue && (
          <div className="mt-1 text-xs text-gray-500">
            <span>Prev: {parseInt(prevValue).toLocaleString()}</span>
            {change && <span className="ml-1">({change})</span>}
          </div>
        )}
      </div>
    );
  };

  /**
   * Smaller version for summary view
   */
  const VendorStatCardSmall = ({ label, value, color, prevValue }: {
    label: string;
    value: string;
    color: string;
    prevValue?: string;
  }) => {
    const change = prevValue ? computeChange(value, prevValue) : null;
    const bgMap: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      gray: 'bg-gray-50 border-gray-200',
      purple: 'bg-purple-50 border-purple-200',
    };
    const textMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      gray: 'text-gray-600',
      purple: 'text-purple-600',
    };
    
    return (
      <div className={`p-3 rounded-lg border ${bgMap[color] || bgMap.blue}`}>
        <div className="text-xs font-medium text-gray-600">{label}</div>
        <div className={`text-xl font-bold ${textMap[color] || textMap.blue}`}>
          {parseInt(value).toLocaleString()}
        </div>
        {prevValue && (
          <div className="mt-0.5 text-xs text-gray-500">
            <span>Prev: {parseInt(prevValue).toLocaleString()}</span>
            {change && <span className="ml-1">({change})</span>}
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders a single stacked comparison bar showing previous month vs current month progress
   * with different colors for each month segment
   */
  const ComparisonProgressBar = ({ task }: { task: Task }) => {
    const currentMonthKey = getCurrentMonthKey();
    const [curYear, curMonth] = currentMonthKey.split('-').map(Number);
    
    // Get previous month key
    let prevMonth = curMonth - 1;
    let prevYear = curYear;
    if (prevMonth < 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevMonthName = MONTH_NAMES[prevMonth - 1];
    const currentMonthName = MONTH_NAMES[curMonth - 1];
    
    // Collect all progress for this task
    const historicalProgress = collectMonthlyProgressForTask(task.name, currentMonthKey);
    const mergedProgress: Record<string, MonthlyProgress> = { ...historicalProgress };
    if (task.monthlyProgress) {
      for (const [key, val] of Object.entries(task.monthlyProgress)) {
        mergedProgress[key] = val;
      }
    }
    
    // Get current month progress
    let currentProgress = mergedProgress[currentMonthKey];
    if (!currentProgress && task.currentCompleted !== undefined && task.currentTotal !== undefined && task.currentTotal > 0) {
      currentProgress = {
        completed: task.currentCompleted,
        total: task.currentTotal,
        percentage: Math.round((task.currentCompleted / task.currentTotal) * 100),
      };
    }
    
    // Get previous month progress
    const prevProgress = mergedProgress[prevMonthKey];
    
    if (!currentProgress) return null;
    
    const prevPercentage = prevProgress?.percentage || 0;
    const currentPercentage = currentProgress.percentage;
    const difference = currentPercentage - prevPercentage;
    const differencePercentage = difference >= 0 ? `+${difference}%` : `${difference}%`;
    
    return (
      <div className="space-y-2">
        {/* Single Stacked Comparison Bar */}
        <div>
          <div className="text-xs font-medium text-gray-600 mb-1">
            Month-over-Month Progress
          </div>
          <div className="w-full bg-gray-200 rounded-full h-7 relative overflow-hidden flex items-center">
            {/* Previous Month Segment */}
            {prevPercentage > 0 && (
              <div
                className="h-full transition-all"
                style={{
                  width: `${prevPercentage}%`,
                  backgroundColor: getProgressColor(prevMonthName),
                }}
                title={prevProgress ? `${prevMonthName}: ${prevProgress.completed}/${prevProgress.total}` : 'No data'}
              />
            )}
            
            {/* Current Month Segment (incremental progress) */}
            {difference > 0 && (
              <div
                className="h-full transition-all"
                style={{
                  width: `${difference}%`,
                  backgroundColor: getProgressColor(currentMonthName),
                }}
                title={`${currentMonthName}: ${currentProgress.completed}/${currentProgress.total}`}
              />
            )}

            {/* Fallback if no previous month data */}
            {prevPercentage === 0 && (
              <div
                className="h-full"
                style={{
                  width: `${currentPercentage}%`,
                  backgroundColor: getProgressColor(currentMonthName),
                }}
                title={`${currentMonthName}: ${currentProgress.completed}/${currentProgress.total}`}
              />
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs mt-2">
          {prevProgress && (
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded" 
                style={{ backgroundColor: getProgressColor(prevMonthName) }}
              />
              <span className="font-medium">{prevMonthName}: {prevPercentage}% ({prevProgress.completed}/{prevProgress.total})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded" 
              style={{ backgroundColor: getProgressColor(currentMonthName) }}
            />
            <span className="font-medium">{currentMonthName}: {difference}% ({currentProgress.completed}/{currentProgress.total})</span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders a multi-month progress bar for a task.
   * Collects progress from all saved months and displays each as a colored segment.
   */
  const MultiMonthProgressBar = ({ task }: { task: Task }) => {
    const currentMonthKey = getCurrentMonthKey();
    
    // Collect progress from all saved previous months + current task's monthlyProgress
    const historicalProgress = collectMonthlyProgressForTask(task.name, currentMonthKey);
    
    // Merge with the task's own monthlyProgress (current session edits that might not be saved yet)
    const mergedProgress: Record<string, MonthlyProgress> = { ...historicalProgress };
    if (task.monthlyProgress) {
      for (const [key, val] of Object.entries(task.monthlyProgress)) {
        mergedProgress[key] = val; // current session data takes priority
      }
    }
    
    // Also ensure the current month has an entry if task has currentCompleted/currentTotal
    if (task.currentCompleted !== undefined && task.currentTotal !== undefined && task.currentTotal > 0) {
      if (!mergedProgress[currentMonthKey]) {
        mergedProgress[currentMonthKey] = {
          completed: task.currentCompleted,
          total: task.currentTotal,
          percentage: Math.round((task.currentCompleted / task.currentTotal) * 100),
        };
      }
    }
    
    const sortedEntries = Object.entries(mergedProgress).sort(([a], [b]) => a.localeCompare(b));
    
    if (sortedEntries.length === 0) {
      // Fallback: simple single-color bar
      return (
        <div className="w-full bg-gray-200 rounded-full h-6">
          <div 
            className="h-6 rounded-full transition-all flex items-center justify-center text-xs text-white font-medium"
            style={{ 
              width: `${task.progress}%`,
              backgroundColor: getProgressColor(month)
            }}
          >
            {task.progress > 10 && `${task.progress}%`}
          </div>
        </div>
      );
    }
    
    if (sortedEntries.length === 1) {
      const [monthKey, progress] = sortedEntries[0];
      const monthName = getMonthName(monthKey);
      const color = getProgressColor(monthName);
      
      return (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div 
              className="h-6 rounded-full transition-all flex items-center justify-center text-xs text-white font-medium"
              style={{ 
                width: `${progress.percentage}%`,
                backgroundColor: color,
              }}
              title={`${format(new Date(monthKey + '-01'), 'MMM yyyy')}: ${progress.completed}/${progress.total}`}
            >
              {progress.percentage > 10 && `${progress.percentage}%`}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="text-xs flex items-center gap-1">
              <div className="size-3 rounded" style={{ backgroundColor: color }} />
              <span className="font-medium">{format(new Date(monthKey + '-01'), 'MMM yyyy')}:</span>
              <span>{progress.completed}/{progress.total} ({progress.percentage}%)</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Multiple months: show stacked segments
    return (
      <div>
        <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
          {sortedEntries.map(([monthKey, progress], index) => {
            const previousPercentage = index > 0 ? sortedEntries[index - 1][1].percentage : 0;
            const width = progress.percentage - previousPercentage;
            const monthName = getMonthName(monthKey);
            const color = getProgressColor(monthName);
            
            if (width <= 0) return null;
            
            return (
              <div
                key={monthKey}
                className="absolute h-full flex items-center justify-center text-xs text-white font-medium"
                style={{
                  left: `${previousPercentage}%`,
                  width: `${width}%`,
                  backgroundColor: color,
                }}
                title={`${format(new Date(monthKey + '-01'), 'MMM yyyy')}: ${progress.completed}/${progress.total}`}
              >
                {width > 10 && `${width.toFixed(0)}%`}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {sortedEntries.map(([monthKey, progress], index) => {
            const monthName = getMonthName(monthKey);
            const color = getProgressColor(monthName);
            const previousPercentage = index > 0 ? sortedEntries[index - 1][1].percentage : 0;
            const segmentWidth = progress.percentage - previousPercentage;
            return (
              <div key={monthKey} className="text-xs flex items-center gap-1">
                <div
                  className="size-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium">{format(new Date(monthKey + '-01'), 'MMM yyyy')}:</span>
                <span>{progress.completed}/{progress.total} ({progress.percentage}%)</span>
                {segmentWidth > 0 && <span className="text-gray-400">[+{segmentWidth.toFixed(0)}%]</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============ SUMMARY VIEW ============
  if (showSummary) {
    const previousMonthData = getPreviousMonthData();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setShowSummary(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            disabled={isGeneratingPDF || isSaving}
          >
            ← Back to Edit
          </button>
          <div className="flex gap-3">
            <button
              onClick={saveReportPermanently}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg"
              disabled={isGeneratingPDF || isSaving}
            >
              <Save className="size-5" />
              {isSaving ? 'SAVING...' : `SAVE PERMANENT CHANGES TO ${month.toUpperCase()} ${year} REPORT`}
            </button>
            <button
              onClick={() => handleDownloadPDF(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={isGeneratingPDF || isSaving}
            >
              <FileDown className="size-4" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Download Summary PDF'}
            </button>
          </div>
        </div>

        <div ref={summaryRef} className="p-8 bg-white border border-gray-200 rounded-lg">
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">VENDOR DATABASE MANAGEMENT</h1>
            <h2 className="text-2xl font-semibold text-gray-800">Monthly Progress Summary</h2>
            <p className="text-lg text-gray-700 mt-3 font-medium">{month} {year}</p>
          </div>

          {/* Vendor stats with previous month comparison */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <VendorStatCardSmall
              label="Total Vendors"
              value={totalVendors}
              color="blue"
              prevValue={previousMonthData?.totalVendors}
            />
            {activeVendors && (
              <VendorStatCardSmall
                label="Active Vendors"
                value={activeVendors}
                color="green"
                prevValue={previousMonthData?.activeVendors}
              />
            )}
            {inactiveVendors && (
              <VendorStatCardSmall
                label="Inactive Vendors"
                value={inactiveVendors}
                color="gray"
                prevValue={previousMonthData?.inactiveVendors}
              />
            )}
            {vendorsProcessed && (
              <VendorStatCardSmall
                label="Processed"
                value={vendorsProcessed}
                color="purple"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3 text-green-700 border-b border-green-200 pb-1">
                ✓ Completed ({completedTasks.length})
              </h3>
              <ul className="space-y-1.5 text-sm">
                {completedTasks
                  .sort((a, b) => (b.showHighlight ? 1 : 0) - (a.showHighlight ? 1 : 0))
                  .map(task => (
                    <li key={task.id} className="flex items-center gap-2">
                      <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div style={{ lineHeight: '2.0' }}>
                        <span className="font-medium">{task.name}</span>
                        {task.showHighlight && <span className="ml-2 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">NEW</span>}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3 text-blue-700 border-b border-blue-200 pb-1">
                ⟳ In Progress ({inProgressTasks.length})
              </h3>
              <ul className="space-y-2 text-sm">
                {inProgressTasks.map(task => {
                  // Collect historical progress for summary view too
                  const currentMonthKey = getCurrentMonthKey();
                  const historicalProgress = collectMonthlyProgressForTask(task.name, currentMonthKey);
                  const mergedProgress: Record<string, MonthlyProgress> = { ...historicalProgress };
                  if (task.monthlyProgress) {
                    for (const [key, val] of Object.entries(task.monthlyProgress)) {
                      mergedProgress[key] = val;
                    }
                  }
                  if (task.currentCompleted !== undefined && task.currentTotal !== undefined && task.currentTotal > 0 && !mergedProgress[currentMonthKey]) {
                    mergedProgress[currentMonthKey] = {
                      completed: task.currentCompleted,
                      total: task.currentTotal,
                      percentage: Math.round((task.currentCompleted / task.currentTotal) * 100),
                    };
                  }
                  const sortedEntries = Object.entries(mergedProgress).sort(([a], [b]) => a.localeCompare(b));
                  const hasMultipleMonths = sortedEntries.length > 1;

                  return (
                    <li key={task.id} className="space-y-1.5 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <Clock className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="font-medium">{task.name}</span>
                        </div>
                        {task.currentTotal !== undefined && task.currentTotal > 0 && (
                          <span className="text-xs font-bold text-blue-600">
                            {task.currentCompleted} / {task.currentTotal}
                          </span>
                        )}
                      </div>
                      
                      {/* Comparison Indicator */}
                      {task.currentTotal !== undefined && task.currentTotal > 0 && (
                        <div className="ml-5">
                          {/* Get comparison data */}
                          {(() => {
                            const currentMonthKey = getCurrentMonthKey();
                            const [curYear, curMonth] = currentMonthKey.split('-').map(Number);
                            let prevMonth = curMonth - 1;
                            let prevYear = curYear;
                            if (prevMonth < 0) {
                              prevMonth = 12;
                              prevYear -= 1;
                            }
                            const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
                            const prevMonthName = MONTH_NAMES[prevMonth - 1];
                            const currentMonthName = MONTH_NAMES[curMonth - 1];
                            
                            const historicalProgress = collectMonthlyProgressForTask(task.name, currentMonthKey);
                            const mergedProgress: Record<string, MonthlyProgress> = { ...historicalProgress };
                            if (task.monthlyProgress) {
                              for (const [key, val] of Object.entries(task.monthlyProgress)) {
                                mergedProgress[key] = val;
                              }
                            }
                            
                            let currentProgress = mergedProgress[currentMonthKey];
                            if (!currentProgress && task.currentCompleted !== undefined && task.currentTotal !== undefined && task.currentTotal > 0) {
                              currentProgress = {
                                completed: task.currentCompleted,
                                total: task.currentTotal,
                                percentage: Math.round((task.currentCompleted / task.currentTotal) * 100),
                              };
                            }
                            
                            const prevProgress = mergedProgress[prevMonthKey];
                            const prevPercentage = prevProgress?.percentage || 0;
                            const currentPercentage = currentProgress?.percentage || 0;
                            const diff = currentPercentage - prevPercentage;
                            const diffSign = diff > 0 ? '+' : '';
                            
                            return (
                              <div className="text-xs space-y-0.5">
                                <div className="flex gap-2 justify-between font-medium text-gray-700">
                                  <span>{prevMonthName}: {prevPercentage}%</span>
                                  <span>→</span>
                                  <span>{currentMonthName}: {currentPercentage}%</span>
                                </div>
                                <div className={`text-center py-0.5 rounded text-xs font-bold ${diff > 0 ? 'bg-green-100 text-green-700' : diff < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️'} {diffSign}{diff}%
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {additionalNotes && (
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h4 className="font-bold text-sm mb-2 text-gray-700">Additional Notes:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{additionalNotes}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-600">
            <p className="mb-1"><strong>Project Context:</strong> Managing {parseInt(totalVendors).toLocaleString()} vendors in database (established since 2017)</p>
            <p><strong>Generated:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ DETAILED PREVIEW ============
  if (showPreview) {
    const previousMonthData = getPreviousMonthData();
    
    // Sort completed tasks: highlighted ones first
    const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
      if (a.showHighlight && !b.showHighlight) return -1;
      if (!a.showHighlight && b.showHighlight) return 1;
      return (a.order || 0) - (b.order || 0);
    });

    const completedByCategory = sortedCompletedTasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    const progressByCategory = inProgressTasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            disabled={isGeneratingPDF || isSaving}
          >
            ← Back to Edit
          </button>
          <div className="flex gap-3">
            <button
              onClick={saveReportPermanently}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg"
              disabled={isGeneratingPDF || isSaving}
            >
              <Save className="size-5" />
              {isSaving ? 'SAVING...' : `SAVE PERMANENT CHANGES TO ${month.toUpperCase()} ${year} REPORT`}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              disabled={isGeneratingPDF || isSaving}
            >
              <Printer className="size-4" />
              Print Report
            </button>
            <button
              onClick={() => handleDownloadPDF(false)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={isGeneratingPDF || isSaving}
            >
              <FileDown className="size-4" />
              {isGeneratingPDF ? 'Generating PDF...' : 'Download Detailed PDF'}
            </button>
          </div>
        </div>

        <div ref={reportRef} className="p-8 bg-white border border-gray-200 rounded-lg space-y-6 print:border-0" data-report-content>
          <div className="text-center border-b-2 border-gray-300 pb-6" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'avoid' }}>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">VENDOR DATABASE MANAGEMENT</h1>
            <h2 className="text-2xl font-semibold text-gray-800">Monthly Progress Report</h2>
            <p className="text-lg text-gray-700 mt-3 font-medium">{month} {year}</p>
            <p className="text-sm text-gray-500 mt-2">Generated: {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>

          {/* Vendor stats with previous month comparison inline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ pageBreakInside: 'avoid' }}>
            <VendorStatCard
              label="Total Vendors"
              value={totalVendors}
              color="blue"
              prevValue={previousMonthData?.totalVendors}
            />
            {activeVendors && (
              <VendorStatCard
                label="Active Vendors"
                value={activeVendors}
                color="green"
                prevValue={previousMonthData?.activeVendors}
              />
            )}
            {inactiveVendors && (
              <VendorStatCard
                label="Inactive Vendors"
                value={inactiveVendors}
                color="gray"
                prevValue={previousMonthData?.inactiveVendors}
              />
            )}
            {vendorsProcessed && (
              <VendorStatCard
                label="Processed This Month"
                value={vendorsProcessed}
                color="purple"
              />
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2 border-b-2 border-green-200 pb-2" style={{ pageBreakAfter: 'avoid' }}>
              <Check className="size-6" />
              Completed Achievements
            </h3>
            {Object.entries(completedByCategory).map(([category, tasks]) => (
              <div key={category} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                <h4 className="font-bold text-green-900 mb-3 text-lg bg-green-50 p-2 rounded" style={{ pageBreakAfter: 'avoid' }}>{category}</h4>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`p-4 border-l-4 rounded ${task.showHighlight ? 'bg-green-100 border-green-600' : 'bg-green-50 border-green-500'}`}
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <div className="flex items-start gap-3">
                        <Check className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-green-900 mb-1">
                            {task.name}
                            {task.showHighlight && (
                              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                ✓ Newly Completed This Month!
                              </span>
                            )}
                          </div>
                          {task.completedDate && (
                            <div className="text-xs font-medium text-green-700 mb-2">
                              ✓ Completed: {format(new Date(task.completedDate), 'MMMM dd, yyyy')}
                            </div>
                          )}
                          {task.notes && (
                            <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{task.notes}</div>
                          )}
                          {task.additionalNotes && (
                            <div className="text-sm bg-yellow-50 border border-yellow-200 p-2 rounded mt-2" style={{ pageBreakInside: 'avoid' }}>
                              <span className="font-semibold text-yellow-900">📝 Notes: </span>
                              <span className="text-yellow-800 whitespace-pre-wrap">{task.additionalNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2 border-b-2 border-blue-200 pb-2" style={{ pageBreakAfter: 'avoid' }}>
              <Clock className="size-6" />
              Ongoing Progress
            </h3>
            {Object.entries(progressByCategory).map(([category, tasks]) => (
              <div key={category} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                <h4 className="font-bold text-blue-900 mb-3 text-lg bg-blue-50 p-2 rounded" style={{ pageBreakAfter: 'avoid' }}>{category}</h4>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium flex-1 text-blue-900">
                          {task.name}
                        </div>
                        <div className="text-sm font-bold ml-4 text-blue-600">
                          {task.progress}%
                        </div>
                      </div>
                      
                      {(task.currentCompleted !== undefined && task.currentTotal !== undefined && task.currentTotal > 0) && (
                        <div className="mb-4 space-y-3">
                          <div className="text-xs font-medium text-gray-600">
                            Current Progress: {task.currentCompleted} / {task.currentTotal} ({task.progress}%)
                          </div>
                          
                          {/* Comparison Bar: Previous vs Current Month */}
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="text-xs font-bold text-gray-700 mb-2">📊 Month-over-Month Comparison:</div>
                            <ComparisonProgressBar task={task} />
                          </div>
                        </div>
                      )}
                      
                      {task.notes && (
                        <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{task.notes}</div>
                      )}
                      
                      {task.additionalNotes && (
                        <div className="text-sm bg-yellow-50 border border-yellow-200 p-2 rounded mt-2" style={{ pageBreakInside: 'avoid' }}>
                          <span className="font-semibold text-yellow-900">📝 Notes: </span>
                          <span className="text-yellow-800 whitespace-pre-wrap">{task.additionalNotes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {additionalNotes && (
            <div style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-xl font-bold mb-4 text-gray-700 border-b-2 border-gray-200 pb-2">Additional Notes</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                <div className="text-gray-700 whitespace-pre-wrap">{additionalNotes}</div>
              </div>
            </div>
          )}

          <div className="border-t-2 border-gray-300 pt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded" style={{ pageBreakInside: 'avoid' }}>
            <p className="mb-2"><strong>Project Context:</strong> Managing {parseInt(totalVendors).toLocaleString()} vendors in database (established since 2017)</p>
            <p><strong>Timeline:</strong> Standardization rules created from mid-2025 until now, work still in progress. Ongoing cleanup and synchronization between MJS and WSI databases</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ EDIT FORM ============
  return (
    <form onSubmit={handleGenerateReport} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium">Month *</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            {MONTH_NAMES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Year *</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block mb-2 font-medium">Total Vendors *</label>
          <input
            type="number"
            value={totalVendors}
            onChange={(e) => setTotalVendors(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Active Vendors</label>
          <input
            type="number"
            value={activeVendors}
            onChange={(e) => setActiveVendors(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Inactive Vendors (Auto)</label>
          <input
            type="number"
            value={inactiveVendors}
            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
            readOnly
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Processed</label>
          <input
            type="number"
            value={vendorsProcessed}
            onChange={(e) => setVendorsProcessed(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-green-700">✓ Completed Tasks</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => sortCompletedTasks('asc')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              title="Sort by date (oldest first)"
            >
              <ArrowUpDown className="size-3" />
              Date ↑
            </button>
            <button
              type="button"
              onClick={() => sortCompletedTasks('desc')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              title="Sort by date (newest first)"
            >
              <ArrowUpDown className="size-3" />
              Date ↓
            </button>
            <button
              type="button"
              onClick={() => addTask('completed')}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="size-4" />
              Add Task
            </button>
          </div>
        </div>
        
        {completedTasks.map((task, index) => (
          <div key={task.id} className="p-4 border-2 border-green-200 bg-green-50 rounded-lg space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveTask('completed', task.id, 'up')}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveTask('completed', task.id, 'down')}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                  disabled={index === completedTasks.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Category (e.g., Data Quality, System Configuration)"
                value={task.category}
                onChange={(e) => updateTask('completed', task.id, 'category', e.target.value)}
                className="w-1/4 p-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Task name"
                value={task.name}
                onChange={(e) => updateTask('completed', task.id, 'name', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeTask('completed', task.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                title="Delete"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.showHighlight || false}
                  onChange={(e) => updateTask('completed', task.id, 'showHighlight', e.target.checked)}
                  className="size-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Show "Newly Completed This Month" Highlight</span>
              </label>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium">Completion Date</label>
              <input
                type="date"
                value={task.completedDate || ''}
                onChange={(e) => updateTask('completed', task.id, 'completedDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <textarea
              placeholder="Details and notes (press Enter for new lines)"
              value={task.notes}
              onChange={(e) => updateTask('completed', task.id, 'notes', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows={3}
            />
            
            <textarea
              placeholder="Additional notes (optional - press Enter for new lines)"
              value={task.additionalNotes || ''}
              onChange={(e) => updateTask('completed', task.id, 'additionalNotes', e.target.value)}
              className="w-full p-2 border border-yellow-300 bg-yellow-50 rounded-lg"
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-blue-700">⟳ In Progress Tasks</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => sortProgressTasks('desc')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              title="Sort by progress (highest first)"
            >
              <ArrowUpDown className="size-3" />
              % ↓
            </button>
            <button
              type="button"
              onClick={() => sortProgressTasks('asc')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
              title="Sort by progress (lowest first)"
            >
              <ArrowUpDown className="size-3" />
              % ↑
            </button>
            <button
              type="button"
              onClick={() => addTask('inProgress')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="size-4" />
              Add Task
            </button>
          </div>
        </div>
        
        {inProgressTasks.map((task, index) => (
          <div key={task.id} className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveTask('inProgress', task.id, 'up')}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveTask('inProgress', task.id, 'down')}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                  disabled={index === inProgressTasks.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateTask('inProgress', task)}
                  className="p-1.5 text-blue-600 hover:bg-blue-200 rounded"
                  title="Duplicate task"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Category"
                value={task.category}
                onChange={(e) => updateTask('inProgress', task.id, 'category', e.target.value)}
                className="w-1/4 p-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Task name"
                value={task.name}
                onChange={(e) => updateTask('inProgress', task.id, 'name', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeTask('inProgress', task.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                title="Delete"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block mb-1 text-sm font-medium">Completed</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={task.currentCompleted || ''}
                  onChange={(e) => updateTask('inProgress', task.id, 'currentCompleted', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Total</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={task.currentTotal || ''}
                    onChange={(e) => updateTask('inProgress', task.id, 'currentTotal', parseInt(e.target.value) || 0)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => copyVendorNumberToTask(task.id, 'total')}
                      className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      title="Copy Total Vendors"
                    >
                      T
                    </button>
                    <button
                      type="button"
                      onClick={() => copyVendorNumberToTask(task.id, 'active')}
                      className="p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      title="Copy Active Vendors"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => copyVendorNumberToTask(task.id, 'inactive')}
                      className="p-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      title="Copy Inactive Vendors"
                    >
                      I
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Progress (Auto)</label>
                <input
                  type="text"
                  value={`${task.progress}%`}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
            </div>
            

            
            <textarea
              placeholder="Details and notes (press Enter for new lines)"
              value={task.notes}
              onChange={(e) => updateTask('inProgress', task.id, 'notes', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows={3}
            />
            
            <textarea
              placeholder="Additional notes (optional - press Enter for new lines)"
              value={task.additionalNotes || ''}
              onChange={(e) => updateTask('inProgress', task.id, 'additionalNotes', e.target.value)}
              className="w-full p-2 border border-yellow-300 bg-yellow-50 rounded-lg"
              rows={2}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block mb-2 font-medium">Additional Notes</label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Any additional notes, observations, or team updates (press Enter for new lines)"
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
        >
          Generate Detailed Report
        </button>
        <button
          type="button"
          onClick={handleGenerateSummary}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-lg flex items-center justify-center gap-2"
        >
          <ListCollapse className="size-5" />
          Generate Simplified Summary
        </button>
      </div>
    </form>
  );
}