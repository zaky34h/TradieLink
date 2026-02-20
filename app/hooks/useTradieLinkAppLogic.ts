import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { EMPTY_BUILDER_STATS } from '../config/constants';
import type {
  AuthUser,
  BuilderDashboardStats,
  BuilderDirectoryItem,
  BuilderJob,
  BuilderTab,
  JobStatus,
  MessageThread,
  QuoteStatus,
  Role,
  Screen,
  ThreadMessage,
  TradeOption,
  TradieJobBoardItem,
  TradieQuote,
  TradieTab,
  TradieDirectoryItem,
} from '../types';
import { login, signup, updateProfile } from '../services/authService';
import { createBuilderJob, getBuilderJobs, getBuilderStats, getTradies } from '../services/builderService';
import { enquireOnJob, getPostedJobsForTradie } from '../services/tradieService';
import {
  closeThread,
  getBuilders,
  getThreadMessages,
  getThreads,
  getTypingStatus,
  markThreadRead,
  sendThreadMessage,
  setTypingStatus,
  startThreadAsBuilder,
  startThreadAsTradie,
} from '../services/messageService';
import { validateCreateJobInput } from '../validation/job';
import { validateLoginInput, validateProfileInput, validateSignupInput } from '../validation/auth';

export function useTradieLinkAppLogic() {
  const [screen, setScreen] = useState<Screen>('login');
  const [builderTab, setBuilderTab] = useState<BuilderTab>('home');
  const [tradieTab, setTradieTab] = useState<TradieTab>('home');
  const [selectedRole, setSelectedRole] = useState<Role>('Builder');
  const [builderCompanyName, setBuilderCompanyName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [about, setAbout] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [certifications, setCertifications] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [availableDates, setAvailableDates] = useState('');
  const [jobs, setJobs] = useState<BuilderJob[]>([]);
  const [builderStats, setBuilderStats] = useState<BuilderDashboardStats>(EMPTY_BUILDER_STATS);
  const [jobsStatusTab, setJobsStatusTab] = useState<JobStatus>('posted');
  const [quotesStatusTab, setQuotesStatusTab] = useState<QuoteStatus>('pending');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [postJobModalVisible, setPostJobModalVisible] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobTradesNeeded, setNewJobTradesNeeded] = useState<TradeOption[]>([]);
  const [tradesDropdownOpen, setTradesDropdownOpen] = useState(false);
  const [newJobDetails, setNewJobDetails] = useState('');
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeThreadMessages, setActiveThreadMessages] = useState<ThreadMessage[]>([]);
  const [builderMessagesView, setBuilderMessagesView] = useState<'active' | 'history'>('active');
  const [tradieMessagesView, setTradieMessagesView] = useState<'active' | 'history'>('active');
  const [messageBody, setMessageBody] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [meTyping, setMeTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [directoryBuilders, setDirectoryBuilders] = useState<BuilderDirectoryItem[]>([]);
  const [directoryTradies, setDirectoryTradies] = useState<TradieDirectoryItem[]>([]);
  const [tradieJobs, setTradieJobs] = useState<TradieJobBoardItem[]>([]);
  const [tradieQuotes, setTradieQuotes] = useState<TradieQuote[]>([]);
  const [selectedTradieJobId, setSelectedTradieJobId] = useState<number | null>(null);
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageTitle = useMemo(() => {
    if (screen === 'signup') return 'Create your TradieLink account';
    if (screen === 'builderHome') return 'Builder Home';
    if (screen === 'tradieHome') return 'Tradie Home';
    return 'Welcome back to TradieLink';
  }, [screen]);

  const builderName = builderCompanyName || companyName.trim() || 'Company Name';
  const visibleJobs = jobs.filter((job) => job.status === jobsStatusTab);
  const selectedJob =
    visibleJobs.find((job) => job.id === selectedJobId) ||
    jobs.find((job) => job.id === selectedJobId) ||
    null;
  const activeThread = threads.find((thread) => thread.id === activeThreadId) || null;
  const selectedTradieJob = tradieJobs.find((job) => job.id === selectedTradieJobId) || null;
  const currentMessagesView = authUser?.role === 'builder' ? builderMessagesView : tradieMessagesView;

  const openRoleHome = (role: Role) => {
    if (role === 'Builder') {
      setBuilderTab('home');
      setScreen('builderHome');
      return;
    }
    setTradieTab('home');
    setScreen('tradieHome');
  };

  const hydrateProfileFields = (user: AuthUser) => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setAbout(user.about || '');
    setCompanyName(user.companyName || '');
    setAddress(user.address || '');
    setOccupation(user.occupation || '');
    setPricePerHour(user.pricePerHour == null ? '' : String(user.pricePerHour));
    setExperienceYears(user.experienceYears == null ? '' : String(user.experienceYears));
    setCertifications(Array.isArray(user.certifications) ? user.certifications.join(', ') : '');
    setPhotoUrl(user.photoUrl || '');
    setEmail(user.email || '');
  };

  const handleLogin = async () => {
    const validation = validateLoginInput(email, password);
    if (validation) {
      Alert.alert('Missing info', validation);
      return;
    }

    try {
      const payload = await login(email, password);
      const role: Role = payload.user.role === 'builder' ? 'Builder' : 'Tradie';
      setAuthToken(payload.token);
      setAuthUser(payload.user);
      setSelectedRole(role);
      setBuilderCompanyName(role === 'Builder' ? payload.user.companyName || '' : '');
      setPassword('');
      hydrateProfileFields(payload.user);
      openRoleHome(role);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to login.');
    }
  };

  const handleSignup = async () => {
    const validation = validateSignupInput({
      email,
      password,
      selectedRole,
      companyName,
      firstName,
      lastName,
      about,
    });
    if (validation) {
      Alert.alert('Missing info', validation);
      return;
    }

    try {
      const payload = await signup({
        role: selectedRole.toLowerCase(),
        firstName,
        lastName,
        about,
        companyName,
        address,
        occupation,
        pricePerHour,
        experienceYears,
        certifications,
        photoUrl,
        email: email.trim(),
        password,
      });

      const role: Role = payload.user.role === 'builder' ? 'Builder' : 'Tradie';
      setAuthToken(payload.token);
      setAuthUser(payload.user);
      setSelectedRole(role);
      setBuilderCompanyName(role === 'Builder' ? payload.user.companyName || '' : '');
      setPassword('');
      hydrateProfileFields(payload.user);
      openRoleHome(role);
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Unable to create account.');
    }
  };

  const resetToLogin = () => {
    setScreen('login');
    setAuthToken('');
    setAuthUser(null);
    setFirstName('');
    setLastName('');
    setAbout('');
    setCompanyName('');
    setAddress('');
    setOccupation('');
    setPricePerHour('');
    setExperienceYears('');
    setCertifications('');
    setPhotoUrl('');
    setAvailableDates('');
    setEmail('');
    setPassword('');
    setBuilderCompanyName('');
    setSelectedRole('Builder');
    setThreads([]);
    setActiveThreadId(null);
    setActiveThreadMessages([]);
    setMessageBody('');
    setMessageStatus('');
    setBuilderMessagesView('active');
    setTradieMessagesView('active');
    setMeTyping(false);
    setPeerTyping(false);
    setDirectoryBuilders([]);
    setDirectoryTradies([]);
    setTradieJobs([]);
    setTradieQuotes([]);
    setSelectedTradieJobId(null);
    setBuilderStats(EMPTY_BUILDER_STATS);
    setJobs([]);
    setQuotesStatusTab('pending');
    setNewJobTradesNeeded([]);
    setTradesDropdownOpen(false);
  };

  const openPostJobModal = () => setPostJobModalVisible(true);

  const closePostJobModal = () => {
    setPostJobModalVisible(false);
    setNewJobTitle('');
    setNewJobLocation('');
    setNewJobTradesNeeded([]);
    setTradesDropdownOpen(false);
    setNewJobDetails('');
  };

  const loadBuilderStats = async () => {
    if (!authToken || authUser?.role !== 'builder') return;
    try {
      const payload = await getBuilderStats(authToken);
      setBuilderStats(payload.stats);
    } catch (_error) {
      setBuilderStats(EMPTY_BUILDER_STATS);
    }
  };

  const loadBuilderJobs = async () => {
    if (!authToken || authUser?.role !== 'builder') return;
    try {
      const payload = await getBuilderJobs(authToken);
      setJobs(payload.jobs);
      if (!payload.jobs.find((job) => job.id === selectedJobId)) {
        setSelectedJobId(null);
      }
    } catch (_error) {
      setJobs([]);
      setSelectedJobId(null);
    }
  };

  const createJob = async () => {
    if (!authToken || authUser?.role !== 'builder') return;

    const validation = validateCreateJobInput(newJobTitle);
    if (validation) {
      Alert.alert('Missing info', validation);
      return;
    }

    try {
      const payload = await createBuilderJob(authToken, {
        title: newJobTitle.trim(),
        location: newJobLocation.trim(),
        tradesNeeded: newJobTradesNeeded,
        details: newJobDetails.trim(),
        status: 'posted',
      });
      setJobs((currentJobs) => [payload.job, ...currentJobs]);
      setJobsStatusTab('posted');
      setSelectedJobId(payload.job.id);
      closePostJobModal();
      setBuilderStats((current) => ({ ...current, pendingOffers: current.pendingOffers + 1 }));
    } catch (error) {
      Alert.alert('Could not post job', error instanceof Error ? error.message : 'Unable to post job.');
    }
  };

  const toggleTradeNeeded = (trade: TradeOption) => {
    setNewJobTradesNeeded((current) =>
      current.includes(trade) ? current.filter((item) => item !== trade) : [...current, trade],
    );
  };

  const loadThreads = async (viewOverride?: 'active' | 'history') => {
    if (!authToken || !authUser) return;
    const view = viewOverride || (authUser.role === 'builder' ? builderMessagesView : tradieMessagesView);
    try {
      const payload = await getThreads(authToken, view);
      setThreads(payload.threads);
      if (!payload.threads.find((thread) => thread.id === activeThreadId)) {
        setActiveThreadId(null);
        setActiveThreadMessages([]);
        setMessageBody('');
        setMeTyping(false);
        setPeerTyping(false);
      }
      if (!payload.threads.length) {
        setActiveThreadId(null);
        setActiveThreadMessages([]);
        setMessageBody('');
        setMeTyping(false);
        setPeerTyping(false);
      }
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to load chats.');
    }
  };

  const loadTradieJobs = async () => {
    if (!authToken || authUser?.role !== 'tradie') return;
    try {
      const payload = await getPostedJobsForTradie(authToken);
      setTradieJobs(payload.jobs);
      if (!payload.jobs.find((job) => job.id === selectedTradieJobId)) {
        setSelectedTradieJobId(null);
      }
    } catch (_error) {
      setTradieJobs([]);
      setSelectedTradieJobId(null);
    }
  };

  const enquireOnTradieJob = async (jobId: number) => {
    if (!authToken || authUser?.role !== 'tradie') return;
    try {
      await enquireOnJob(authToken, jobId);
      setTradieJobs((current) =>
        current.map((job) =>
          job.id === jobId
            ? {
                ...job,
                hasEnquired: true,
                enquiriesCount: job.hasEnquired ? job.enquiriesCount : job.enquiriesCount + 1,
              }
            : job,
        ),
      );
      Alert.alert('Enquiry sent', 'Your enquiry has been sent to the builder.');
    } catch (error) {
      Alert.alert('Could not enquire', error instanceof Error ? error.message : 'Unable to submit enquiry.');
    }
  };

  const addTradieQuote = (quote: TradieQuote) => {
    setTradieQuotes((current) => [quote, ...current]);
  };

  const loadThreadMessages = async (threadId: number, markRead = true) => {
    if (!authToken) return;
    try {
      const payload = await getThreadMessages(authToken, threadId);
      setActiveThreadId(threadId);
      setActiveThreadMessages(payload.messages);
      if (markRead) {
        await markThreadRead(authToken, threadId);
        setThreads((current) =>
          current.map((thread) => (thread.id === threadId ? { ...thread, unreadCount: 0 } : thread)),
        );
      }
      setMessageStatus('');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to open chat.');
    }
  };

  const openThread = async (threadId: number) => {
    await loadThreadMessages(threadId, true);
  };

  const sendMessage = async () => {
    if (!authToken || !activeThreadId || !messageBody.trim()) return;
    try {
      await sendThreadMessage(authToken, activeThreadId, messageBody.trim());
      setMessageBody('');
      setMeTyping(false);
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
        typingStopTimeoutRef.current = null;
      }
      await loadThreadMessages(activeThreadId, true);
      await loadThreads();
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to send message.');
    }
  };

  const startTradieChat = async (builderId: number) => {
    if (!authToken) return;
    try {
      setTradieMessagesView('active');
      const payload = await startThreadAsTradie(authToken, builderId);
      await loadThreads('active');
      await openThread(payload.thread.id);
      setTradieTab('messages');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to start chat.');
    }
  };

  const startBuilderChat = async (tradieId: number) => {
    if (!authToken) return;
    try {
      setBuilderMessagesView('active');
      const payload = await startThreadAsBuilder(authToken, tradieId);
      await loadThreads('active');
      await loadBuilderStats();
      await openThread(payload.thread.id);
      setBuilderTab('messages');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to start chat.');
    }
  };

  const saveProfile = async () => {
    if (!authToken || !authUser) return;
    const validation = validateProfileInput({ firstName, lastName, about, email });
    if (validation) {
      Alert.alert('Missing info', validation);
      return;
    }

    try {
      const payload = await updateProfile(authToken, {
        firstName,
        lastName,
        about,
        companyName,
        address,
        occupation,
        pricePerHour,
        experienceYears,
        certifications,
        photoUrl,
        email: email.trim(),
        password: password.trim() || undefined,
      });

      const role: Role = payload.user.role === 'builder' ? 'Builder' : 'Tradie';
      setAuthToken(payload.token);
      setAuthUser(payload.user);
      setSelectedRole(role);
      setBuilderCompanyName(payload.user.companyName || '');
      setPassword('');
      hydrateProfileFields(payload.user);
      Alert.alert('Saved', 'Profile details updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to update profile.');
    }
  };

  const refreshTyping = async (threadId: number) => {
    if (!authToken) return;
    try {
      const payload = await getTypingStatus(authToken, threadId);
      setMeTyping(payload.meTyping);
      setPeerTyping(payload.peerTyping);
    } catch (_error) {
      setMeTyping(false);
      setPeerTyping(false);
    }
  };

  const handleMessageBodyChange = (nextValue: string) => {
    setMessageBody(nextValue);
    if (!authToken || !activeThreadId) return;

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }

    if (!nextValue.trim()) {
      void setTypingStatus(authToken, activeThreadId, false);
      setMeTyping(false);
      return;
    }

    if (!meTyping) {
      void setTypingStatus(authToken, activeThreadId, true);
      setMeTyping(true);
    }

    typingStopTimeoutRef.current = setTimeout(() => {
      if (!authToken || !activeThreadId) return;
      void setTypingStatus(authToken, activeThreadId, false);
      setMeTyping(false);
    }, 1200);
  };

  const closeActiveThread = async () => {
    if (!authToken || !activeThreadId) return;
    try {
      await closeThread(authToken, activeThreadId);
      setActiveThreadId(null);
      setActiveThreadMessages([]);
      setMessageBody('');
      setMeTyping(false);
      setPeerTyping(false);
      await loadThreads();
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to close chat.');
    }
  };

  const backFromThread = () => {
    setActiveThreadId(null);
    setActiveThreadMessages([]);
    setMessageBody('');
    setMeTyping(false);
    setPeerTyping(false);
  };

  useEffect(() => {
    if (!authToken || !authUser) return;
    void loadThreads();
    if (authUser.role === 'builder') {
      void loadBuilderStats();
      void loadBuilderJobs();
    }
  }, [authToken, authUser]);

  useEffect(() => {
    if (!authToken) return;
    if (screen === 'builderHome' && builderTab === 'messages') {
      void loadThreads(builderMessagesView);
      if (authUser?.role === 'builder') {
        void loadBuilderStats();
      }
      return;
    }
    if (screen === 'builderHome' && builderTab === 'jobs' && authUser?.role === 'builder') {
      void loadBuilderJobs();
      return;
    }
    if (screen === 'tradieHome') {
      void loadThreads(tradieMessagesView);
      if (tradieTab === 'jobs' && authUser?.role === 'tradie') {
        void loadTradieJobs();
      }
    }
  }, [authToken, authUser?.role, screen, builderTab, tradieTab, builderMessagesView, tradieMessagesView]);

  useEffect(() => {
    if (!authToken || authUser?.role !== 'tradie') return;
    (async () => {
      try {
        const payload = await getBuilders(authToken);
        setDirectoryBuilders(payload.builders);
      } catch (_error) {
        setDirectoryBuilders([]);
      }
    })();
  }, [authToken, authUser?.role]);

  useEffect(() => {
    if (!authToken || !authUser) return;
    const viewingBuilderMessages = screen === 'builderHome' && builderTab === 'messages';
    const viewingTradieMessages = screen === 'tradieHome' && tradieTab === 'messages';
    if (!viewingBuilderMessages && !viewingTradieMessages) return;

    const interval = setInterval(() => {
      void loadThreads(currentMessagesView);
      if (activeThreadId) {
        void loadThreadMessages(activeThreadId, true);
        void refreshTyping(activeThreadId);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [authToken, authUser, screen, builderTab, tradieTab, activeThreadId, currentMessagesView]);

  useEffect(() => {
    if (!authToken || !activeThreadId) return;
    void refreshTyping(activeThreadId);
  }, [authToken, activeThreadId]);

  useEffect(() => {
    return () => {
      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authToken || !activeThreadId) return;
    return () => {
      void setTypingStatus(authToken, activeThreadId, false);
    };
  }, [authToken, activeThreadId]);

  useEffect(() => {
    if (!authToken || authUser?.role !== 'tradie') return;
    void loadTradieJobs();
  }, [authToken, authUser?.role]);

  useEffect(() => {
    if (!authToken || authUser?.role !== 'builder') return;
    (async () => {
      try {
        const payload = await getTradies(authToken);
        setDirectoryTradies(payload.tradies);
      } catch (_error) {
        setDirectoryTradies([]);
      }
    })();
  }, [authToken, authUser?.role]);

  return {
    screen,
    setScreen,
    builderTab,
    setBuilderTab,
    tradieTab,
    setTradieTab,
    selectedRole,
    setSelectedRole,
    builderCompanyName,
    rememberMe,
    setRememberMe,
    authToken,
    authUser,
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    about,
    setAbout,
    companyName,
    setCompanyName,
    address,
    setAddress,
    occupation,
    setOccupation,
    pricePerHour,
    setPricePerHour,
    experienceYears,
    setExperienceYears,
    certifications,
    setCertifications,
    photoUrl,
    setPhotoUrl,
    availableDates,
    setAvailableDates,
    jobs,
    builderStats,
    jobsStatusTab,
    setJobsStatusTab,
    quotesStatusTab,
    setQuotesStatusTab,
    selectedJobId,
    setSelectedJobId,
    postJobModalVisible,
    newJobTitle,
    setNewJobTitle,
    newJobLocation,
    setNewJobLocation,
    newJobTradesNeeded,
    setNewJobTradesNeeded,
    tradesDropdownOpen,
    setTradesDropdownOpen,
    newJobDetails,
    setNewJobDetails,
    threads,
    activeThreadId,
    setActiveThreadId,
    activeThread,
    activeThreadMessages,
    setActiveThreadMessages,
    builderMessagesView,
    setBuilderMessagesView,
    tradieMessagesView,
    setTradieMessagesView,
    messageBody,
    setMessageBody,
    handleMessageBodyChange,
    messageStatus,
    meTyping,
    peerTyping,
    directoryBuilders,
    directoryTradies,
    tradieJobs,
    tradieQuotes,
    addTradieQuote,
    selectedTradieJobId,
    setSelectedTradieJobId,
    selectedTradieJob,
    pageTitle,
    builderName,
    visibleJobs,
    selectedJob,
    handleLogin,
    handleSignup,
    resetToLogin,
    openPostJobModal,
    closePostJobModal,
    createJob,
    toggleTradeNeeded,
    openThread,
    closeActiveThread,
    backFromThread,
    sendMessage,
    startTradieChat,
    startBuilderChat,
    enquireOnTradieJob,
    saveProfile,
    isAuthScreen: screen === 'login' || screen === 'signup',
    isSignup: screen === 'signup',
    isLogin: screen === 'login',
    isTradie: selectedRole === 'Tradie',
    isBuilderScreen: screen === 'builderHome',
    useLightTheme: screen === 'login' || screen === 'signup' || screen === 'builderHome' || screen === 'tradieHome',
  };
}
