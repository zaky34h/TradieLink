import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Role = 'Builder' | 'Tradie';
type Screen = 'login' | 'signup' | 'builderHome' | 'tradieHome';
type BuilderTab = 'home' | 'jobs' | 'messages' | 'quotes' | 'pay' | 'profile';
type JobStatus = 'posted' | 'inProgress' | 'done';
type BuilderJob = {
  id: string;
  title: string;
  location: string;
  details: string;
  status: JobStatus;
  interestedTradies: string[];
};
type AuthUser = {
  id: number;
  role: 'builder' | 'tradie';
  firstName: string;
  lastName: string;
  companyName?: string | null;
  occupation?: string | null;
  email: string;
};
type MessageThread = {
  id: number;
  participant: {
    id: number;
    role: 'builder' | 'tradie';
    name: string;
    subtitle?: string;
  };
  lastMessage: string | null;
  lastMessageAt: string;
};
type ThreadMessage = {
  id: number;
  threadId: number;
  senderId: number;
  senderRole?: 'builder' | 'tradie';
  senderName?: string;
  body: string;
  createdAt: string;
};
type BuilderDirectoryItem = {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  displayName: string;
};
const BRAND_BLUE = '#1DB5AE';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed.');
  }
  return data as T;
}

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed.');
  }
  return data as T;
}

async function postJsonAuthed<T>(path: string, body: unknown, token: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed.');
  }
  return data as T;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [builderTab, setBuilderTab] = useState<BuilderTab>('home');
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
  const [jobs, setJobs] = useState<BuilderJob[]>([
    {
      id: 'j1',
      title: 'Fix leaking roof at townhouse',
      location: 'Parramatta',
      details: 'Need experienced roofer for urgent leak repair before weekend rain.',
      status: 'posted',
      interestedTradies: ['Alex T.', 'Mason K.'],
    },
    {
      id: 'j2',
      title: 'Install kitchen cabinets',
      location: 'Chatswood',
      details: 'Cabinet install for renovation project. Materials on site.',
      status: 'inProgress',
      interestedTradies: ['Jordan P.'],
    },
    {
      id: 'j3',
      title: 'Repaint office interior',
      location: 'Sydney CBD',
      details: 'Two-level office repaint completed last week.',
      status: 'done',
      interestedTradies: ['Sam R.'],
    },
  ]);
  const [jobsStatusTab, setJobsStatusTab] = useState<JobStatus>('posted');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [postJobModalVisible, setPostJobModalVisible] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobDetails, setNewJobDetails] = useState('');
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [activeThreadMessages, setActiveThreadMessages] = useState<ThreadMessage[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [directoryBuilders, setDirectoryBuilders] = useState<BuilderDirectoryItem[]>([]);

  const pageTitle = useMemo(() => {
    if (screen === 'signup') return 'Create your TradieLink account';
    if (screen === 'builderHome') return 'Builder Home';
    if (screen === 'tradieHome') return 'Tradie Home';
    return 'Welcome back to TradieLink';
  }, [screen]);

  const openRoleHome = (role: Role) => {
    if (role === 'Builder') {
      setBuilderTab('home');
      setScreen('builderHome');
      return;
    }
    setScreen('tradieHome');
  };

  const handleLogin = async () => {
    try {
      const payload = await postJson<{
        ok: true;
        token: string;
        user: AuthUser;
      }>('/auth/login', {
        email: email.trim(),
        password,
      });

      const role: Role = payload.user.role === 'builder' ? 'Builder' : 'Tradie';
      setAuthToken(payload.token);
      setAuthUser(payload.user);
      setSelectedRole(role);
      setBuilderCompanyName(role === 'Builder' ? payload.user.companyName || '' : '');
      openRoleHome(role);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to login.');
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Email and password are required.');
      return;
    }
    if (selectedRole === 'Builder' && !companyName.trim()) {
      Alert.alert('Missing info', 'Company name is required for builders.');
      return;
    }

    try {
      const payload = await postJson<{
        ok: true;
        token: string;
        user: AuthUser;
      }>('/auth/register', {
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
      openRoleHome(role);
    } catch (error) {
      Alert.alert(
        'Could not create account',
        error instanceof Error ? error.message : 'Unable to create account.',
      );
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
    setDirectoryBuilders([]);
  };

  const isAuthScreen = screen === 'login' || screen === 'signup';
  const isSignup = screen === 'signup';
  const isBuilderHome = screen === 'builderHome';
  const isLogin = screen === 'login';
  const isTradie = selectedRole === 'Tradie';
  const isBuilderScreen = screen === 'builderHome';
  const useLightTheme = isLogin || isSignup || isBuilderScreen || screen === 'tradieHome';
  const builderName = builderCompanyName || companyName.trim() || 'Company Name';
  const visibleJobs = jobs.filter((job) => job.status === jobsStatusTab);
  const selectedJob =
    visibleJobs.find((job) => job.id === selectedJobId) ||
    jobs.find((job) => job.id === selectedJobId) ||
    null;

  const openPostJobModal = () => {
    setPostJobModalVisible(true);
  };

  const closePostJobModal = () => {
    setPostJobModalVisible(false);
    setNewJobTitle('');
    setNewJobLocation('');
    setNewJobDetails('');
  };

  const createJob = () => {
    if (!newJobTitle.trim()) {
      Alert.alert('Missing info', 'Please enter a job title.');
      return;
    }

    const job: BuilderJob = {
      id: `job-${Date.now()}`,
      title: newJobTitle.trim(),
      location: newJobLocation.trim() || 'Location not set',
      details: newJobDetails.trim() || 'No details added yet.',
      status: 'posted',
      interestedTradies: [],
    };

    setJobs((currentJobs) => [job, ...currentJobs]);
    setJobsStatusTab('posted');
    setSelectedJobId(job.id);
    closePostJobModal();
  };
  const activeThread = threads.find((thread) => thread.id === activeThreadId) || null;

  const loadThreads = async () => {
    if (!authToken) return;
    try {
      const payload = await getJson<{ ok: true; threads: MessageThread[] }>(
        '/messages/threads',
        authToken,
      );
      setThreads(payload.threads);
      if (!payload.threads.find((thread) => thread.id === activeThreadId)) {
        setActiveThreadId(null);
        setActiveThreadMessages([]);
      }
      if (!payload.threads.length) {
        setActiveThreadId(null);
        setActiveThreadMessages([]);
      }
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to load chats.');
    }
  };

  const openThread = async (threadId: number) => {
    if (!authToken) return;
    try {
      const payload = await getJson<{ ok: true; messages: ThreadMessage[] }>(
        `/messages/threads/${threadId}`,
        authToken,
      );
      setActiveThreadId(threadId);
      setActiveThreadMessages(payload.messages);
      setMessageStatus('');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to open chat.');
    }
  };

  const sendMessage = async () => {
    if (!authToken || !activeThreadId || !messageBody.trim()) return;
    try {
      await postJsonAuthed(
        `/messages/threads/${activeThreadId}/messages`,
        { body: messageBody.trim() },
        authToken,
      );
      setMessageBody('');
      await openThread(activeThreadId);
      await loadThreads();
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to send message.');
    }
  };

  const startTradieChat = async (builderId: number) => {
    if (!authToken) return;
    try {
      const payload = await postJsonAuthed<{ ok: true; thread: { id: number } }>(
        '/messages/threads',
        { builderId },
        authToken,
      );
      await loadThreads();
      await openThread(payload.thread.id);
      setBuilderTab('messages');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Unable to start chat.');
    }
  };

  useEffect(() => {
    if (!authToken || !authUser) return;
    void loadThreads();
  }, [authToken, authUser]);

  useEffect(() => {
    if (!authToken) return;
    if (screen === 'builderHome' && builderTab === 'messages') {
      void loadThreads();
      return;
    }
    if (screen === 'tradieHome') {
      void loadThreads();
    }
  }, [authToken, screen, builderTab]);

  useEffect(() => {
    if (!authToken || authUser?.role !== 'tradie') return;
    (async () => {
      try {
        const payload = await getJson<{ ok: true; builders: BuilderDirectoryItem[] }>(
          '/builders',
          authToken,
        );
        setDirectoryBuilders(payload.builders);
      } catch (_error) {
        setDirectoryBuilders([]);
      }
    })();
  }, [authToken, authUser?.role]);

  return (
    <SafeAreaView style={[styles.safe, useLightTheme && styles.safeLight]}>
      <StatusBar style={useLightTheme ? 'dark' : 'light'} />
      <View
        style={[
          styles.container,
          isLogin && styles.containerLogin,
          isSignup && styles.containerSignup,
          isBuilderScreen && styles.containerBuilder,
        ]}
      >
        {!isLogin && !isSignup && !isBuilderScreen && (
          <>
            <Text style={styles.brand}>TradieLink</Text>
            <Text style={styles.title}>{pageTitle}</Text>
          </>
        )}

        {isLogin && (
          <View style={styles.loginShell}>
            <View style={styles.loginLogoWrap}>
              <Image
                source={require('./assets/tradielink-logo.png')}
                style={styles.loginLogo}
                resizeMode="contain"
              />
            </View>

            <View>
              <Text style={styles.loginLabel}>Email Address</Text>
              <TextInput
                placeholder="you@email.com"
                style={styles.loginInput}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text style={styles.loginLabel}>Password</Text>
              <TextInput
                placeholder="••••••••"
                style={styles.loginInput}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              />
              <Text>Remember me</Text>
            </Pressable>

            <Pressable style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </Pressable>

            <Pressable
              onPress={() => setScreen('signup')}
              style={styles.signupFromLoginButton}
            >
              <Text style={styles.signupFromLoginText}>Create an account</Text>
            </Pressable>
          </View>
        )}

        {isSignup && (
          <ScrollView
            contentContainerStyle={styles.signupContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.signupTitle}>Create Account</Text>

            <View style={styles.roleRow}>
              <Pressable
                onPress={() => setSelectedRole('Builder')}
                style={[
                  styles.signupRoleButton,
                  !isTradie && styles.signupRoleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.signupRoleText,
                    !isTradie && styles.signupRoleTextActive,
                  ]}
                >
                  Builder
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedRole('Tradie')}
                style={[
                  styles.signupRoleButton,
                  isTradie && styles.signupRoleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.signupRoleText,
                    isTradie && styles.signupRoleTextActive,
                  ]}
                >
                  Tradie
                </Text>
              </Pressable>
            </View>

            <Field label="First Name" value={firstName} onChangeText={setFirstName} />
            <Field label="Last Name" value={lastName} onChangeText={setLastName} />
            <Field label="About Yourself" value={about} onChangeText={setAbout} multiline />

            {!isTradie ? (
              <>
                <Field
                  label="Company Name"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
                <Field label="Address" value={address} onChangeText={setAddress} />
              </>
            ) : (
              <>
                <Field label="Occupation" value={occupation} onChangeText={setOccupation} />
                <Field
                  label="Price Per Hour"
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  keyboardType="numeric"
                />
                <Field
                  label="Experience (Years)"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="numeric"
                  placeholder="e.g. 3"
                />
                <Field
                  label="Certifications (comma separated)"
                  value={certifications}
                  onChangeText={setCertifications}
                  placeholder="White Card, Working at Heights, ..."
                />
                <Field
                  label="Photo URL (optional)"
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  autoCapitalize="none"
                  placeholder="https://..."
                />
                <Field
                  label="Availability Dates"
                  value={availableDates}
                  onChangeText={setAvailableDates}
                  placeholder="2026-03-01, 2026-03-02"
                />
              </>
            )}

            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable onPress={handleSignup} style={styles.signupSubmitButton}>
              <Text style={styles.signupSubmitText}>Create Account</Text>
            </Pressable>

            <Pressable onPress={() => setScreen('login')}>
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </Pressable>
          </ScrollView>
        )}

        {isBuilderScreen && (
          <>
            <ScrollView
              style={styles.builderScroll}
              contentContainerStyle={styles.builderContent}
              showsVerticalScrollIndicator={false}
            >
              {builderTab === 'home' && (
                <>
                  <View style={styles.builderHeader}>
                    <Text style={styles.builderWelcome}>Welcome Back,</Text>
                    <Text style={styles.builderCompany}>{builderName}</Text>
                  </View>

                  <View style={styles.builderStatRow}>
                    <BuilderStatCard title="Active Chats" value="0" />
                    <BuilderStatCard title="Pending Offers" value="0" />
                  </View>
                  <View style={styles.builderStatRow}>
                    <BuilderStatCard title="Saved Tradies" value="0" />
                    <BuilderStatCard title="Pending Pay" value="0" />
                  </View>

                  <View style={styles.builderActionsWrap}>
                    <Text style={styles.builderActionsTitle}>Quick Actions</Text>
                    <BuilderActionButton
                      label="Browse Tradies"
                      subtitle="Find available workers by trade and date"
                      tone="brand"
                    />
                    <BuilderActionButton
                      label="Messages"
                      subtitle="View conversations with tradies"
                      onPress={() => setBuilderTab('messages')}
                    />
                    <BuilderActionButton
                      label="Generate Work Offer"
                      subtitle="Send formal offer details to a tradie"
                      tone="brand"
                    />
                  </View>
                </>
              )}

              {builderTab === 'jobs' && (
                <View style={styles.jobsPage}>
                  <View style={styles.jobsHeaderRow}>
                    <Text style={styles.jobsHeaderTitle}>Jobs</Text>
                    <Pressable style={styles.postJobButton} onPress={openPostJobModal}>
                      <Ionicons name="add" size={18} color="#111111" />
                      <Text style={styles.postJobButtonText}>Post a Job</Text>
                    </Pressable>
                  </View>

                  <View style={styles.jobsStatusTabs}>
                    {(['posted', 'inProgress', 'done'] as JobStatus[]).map((status) => {
                      const active = jobsStatusTab === status;
                      const label =
                        status === 'posted'
                          ? 'Posted'
                          : status === 'inProgress'
                            ? 'In Progress'
                            : 'Done';
                      return (
                        <Pressable
                          key={status}
                          onPress={() => {
                            setSelectedJobId(null);
                            setJobsStatusTab(status);
                          }}
                          style={[
                            styles.jobsStatusTabButton,
                            active && styles.jobsStatusTabButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.jobsStatusTabText,
                              active && styles.jobsStatusTabTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.jobsListWrap}>
                    {visibleJobs.length === 0 ? (
                      <Text style={styles.jobsEmptyState}>
                        No jobs in this tab yet.
                      </Text>
                    ) : (
                      visibleJobs.map((job) => {
                        const active = selectedJobId === job.id;
                        return (
                          <Pressable
                            key={job.id}
                            style={[styles.jobCard, active && styles.jobCardActive]}
                            onPress={() => setSelectedJobId(active ? null : job.id)}
                          >
                            <Text style={styles.jobCardTitle}>{job.title}</Text>
                            <Text style={styles.jobCardMeta}>{job.location}</Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>

                  {selectedJob && (
                    <View style={styles.jobDetailsCard}>
                      <View style={styles.jobDetailsHeaderRow}>
                        <Text style={styles.jobDetailsTitle}>Job Details</Text>
                        <Pressable
                          style={styles.jobDetailsCloseBtn}
                          onPress={() => setSelectedJobId(null)}
                        >
                          <Text style={styles.jobDetailsCloseText}>Close</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.jobDetailsMainTitle}>{selectedJob.title}</Text>
                      <Text style={styles.jobDetailsText}>{selectedJob.details}</Text>
                      <Text style={styles.jobDetailsSubheading}>Interested Tradies</Text>
                      {selectedJob.interestedTradies.length === 0 ? (
                        <Text style={styles.jobDetailsText}>
                          No tradies have shown interest yet.
                        </Text>
                      ) : (
                        selectedJob.interestedTradies.map((tradie) => (
                          <Text key={tradie} style={styles.jobInterestedItem}>
                            - {tradie}
                          </Text>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}

              {builderTab === 'messages' && (
                <View style={styles.builderSectionPage}>
                  <Text style={styles.jobsHeaderTitle}>Messages</Text>
                  <View style={styles.messagesLayout}>
                    <View style={styles.messagesListCard}>
                      {threads.length === 0 ? (
                        <Text style={styles.builderPaneBody}>
                          No chats yet. A tradie must start the first conversation.
                        </Text>
                      ) : (
                        threads.map((thread) => {
                          const active = thread.id === activeThreadId;
                          return (
                            <Pressable
                              key={thread.id}
                              style={[styles.messageThreadRow, active && styles.messageThreadRowActive]}
                              onPress={() => openThread(thread.id)}
                            >
                              <Text style={styles.messageThreadName}>{thread.participant.name}</Text>
                              <Text style={styles.messageThreadSubtitle}>
                                {thread.lastMessage || 'No messages yet'}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}
                    </View>

                    {activeThread && (
                      <View style={styles.messagesDetailCard}>
                        <Text style={styles.messagesDetailTitle}>{activeThread.participant.name}</Text>
                        <View style={styles.messagesListWrap}>
                          {activeThreadMessages.length === 0 ? (
                            <Text style={styles.builderPaneBody}>No messages in this chat yet.</Text>
                          ) : (
                            activeThreadMessages.map((item) => (
                              <View
                                key={item.id}
                                style={[
                                  styles.messageBubble,
                                  item.senderId === authUser?.id
                                    ? styles.messageBubbleMine
                                    : styles.messageBubbleOther,
                                ]}
                              >
                                <Text style={styles.messageBubbleText}>{item.body}</Text>
                              </View>
                            ))
                          )}
                        </View>
                        <View style={styles.messageComposerRow}>
                          <TextInput
                            value={messageBody}
                            onChangeText={setMessageBody}
                            placeholder="Write a message..."
                            style={styles.messageComposerInput}
                          />
                          <Pressable style={styles.messageSendBtn} onPress={sendMessage}>
                            <Text style={styles.messageSendText}>Send</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                    {!!messageStatus && <Text style={styles.messageStatusText}>{messageStatus}</Text>}
                  </View>
                </View>
              )}

              {builderTab === 'quotes' && (
                <View style={styles.builderSectionPage}>
                  <Text style={styles.jobsHeaderTitle}>Quotes</Text>
                  <View style={styles.builderSectionCard}>
                    <Text style={styles.builderPaneBody}>
                      Incoming and accepted quotes will appear here.
                    </Text>
                  </View>
                </View>
              )}

              {builderTab === 'pay' && (
                <View style={styles.builderSectionPage}>
                  <Text style={styles.jobsHeaderTitle}>Pay</Text>
                  <View style={styles.builderSectionCard}>
                    <Text style={styles.builderPaneBody}>
                      Payment tracking and pending payouts will appear here.
                    </Text>
                  </View>
                </View>
              )}

              {builderTab === 'profile' && (
                <View style={styles.builderSectionPage}>
                  <Text style={styles.jobsHeaderTitle}>Profile</Text>
                  <View style={styles.profilePageContent}>
                    <View style={styles.profileFields}>
                      <Field label="First Name" value={firstName} onChangeText={setFirstName} />
                      <Field label="Last Name" value={lastName} onChangeText={setLastName} />
                      <Field label="About Yourself" value={about} onChangeText={setAbout} multiline />
                      <Field
                        label="Company Name"
                        value={companyName}
                        onChangeText={setCompanyName}
                      />
                      <Field label="Address" value={address} onChangeText={setAddress} />
                      <Field
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <Field
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>
                    <Pressable
                      style={styles.profileSaveBtn}
                      onPress={() => Alert.alert('Saved', 'Profile details updated.')}
                    >
                      <Text style={styles.profileSaveText}>Save Profile</Text>
                    </Pressable>
                    <Pressable style={styles.builderLogoutBtn} onPress={resetToLogin}>
                      <Text style={styles.builderLogoutText}>Logout</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.bottomTabs}>
              {(['home', 'jobs', 'messages', 'quotes', 'pay', 'profile'] as BuilderTab[]).map((tab) => {
                const active = builderTab === tab;
                const color = active ? '#111111' : '#444444';
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setBuilderTab(tab)}
                    style={styles.bottomTabItem}
                  >
                    <View style={styles.bottomTabIconWrap}>
                      <Ionicons
                        name={
                          tab === 'home'
                            ? 'home'
                            : tab === 'jobs'
                              ? 'briefcase'
                              : tab === 'messages'
                                ? 'chatbubble'
                                : tab === 'quotes'
                                  ? 'document-text'
                                  : tab === 'pay'
                                    ? 'card'
                                    : 'person'
                        }
                        size={22}
                        color={color}
                      />
                    </View>
                    <Text style={[styles.bottomTabText, { color }]}>
                      {tab === 'home'
                        ? 'Home'
                        : tab === 'jobs'
                          ? 'Jobs'
                          : tab === 'messages'
                            ? 'Messages'
                            : tab === 'quotes'
                              ? 'Quotes'
                              : tab === 'pay'
                                ? 'Pay'
                            : 'Profile'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Modal
              visible={postJobModalVisible}
              transparent
              animationType="slide"
              onRequestClose={closePostJobModal}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Post a Job</Text>
                  <Text style={styles.modalSubtitle}>
                    Fill initial details for now. We can add exact LabourLink fields next.
                  </Text>

                  <Text style={styles.modalLabel}>Job Title</Text>
                  <TextInput
                    value={newJobTitle}
                    onChangeText={setNewJobTitle}
                    placeholder="e.g. Bathroom tile replacement"
                    style={styles.modalInput}
                  />

                  <Text style={styles.modalLabel}>Location</Text>
                  <TextInput
                    value={newJobLocation}
                    onChangeText={setNewJobLocation}
                    placeholder="e.g. Bondi"
                    style={styles.modalInput}
                  />

                  <Text style={styles.modalLabel}>Details</Text>
                  <TextInput
                    value={newJobDetails}
                    onChangeText={setNewJobDetails}
                    placeholder="Briefly describe the job..."
                    style={[styles.modalInput, styles.modalInputMultiline]}
                    multiline
                  />

                  <View style={styles.modalActions}>
                    <Pressable style={styles.modalButtonSecondary} onPress={closePostJobModal}>
                      <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.modalButtonPrimary} onPress={createJob}>
                      <Text style={styles.modalButtonPrimaryText}>Post</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

        {!isAuthScreen && !isBuilderScreen && (
          <ScrollView
            style={styles.builderScroll}
            contentContainerStyle={styles.builderContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.jobsHeaderTitle}>Messages</Text>
            <View style={styles.tradieStartCard}>
              <Text style={styles.messageSectionTitle}>Start Chat With Builder</Text>
              {directoryBuilders.length === 0 ? (
                <Text style={styles.builderPaneBody}>No builders available to message yet.</Text>
              ) : (
                directoryBuilders.map((builder) => (
                  <Pressable
                    key={builder.id}
                    style={styles.tradieStartRow}
                    onPress={() => startTradieChat(builder.id)}
                  >
                    <Text style={styles.messageThreadName}>{builder.displayName}</Text>
                    <Text style={styles.messageStartAction}>Start Chat</Text>
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.messagesLayout}>
              <View style={styles.messagesListCard}>
                {threads.length === 0 ? (
                  <Text style={styles.builderPaneBody}>No active chats yet.</Text>
                ) : (
                  threads.map((thread) => {
                    const active = thread.id === activeThreadId;
                    return (
                      <Pressable
                        key={thread.id}
                        style={[styles.messageThreadRow, active && styles.messageThreadRowActive]}
                        onPress={() => openThread(thread.id)}
                      >
                        <Text style={styles.messageThreadName}>{thread.participant.name}</Text>
                        <Text style={styles.messageThreadSubtitle}>
                          {thread.lastMessage || 'No messages yet'}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>

              {activeThread && (
                <View style={styles.messagesDetailCard}>
                  <Text style={styles.messagesDetailTitle}>{activeThread.participant.name}</Text>
                  <View style={styles.messagesListWrap}>
                    {activeThreadMessages.length === 0 ? (
                      <Text style={styles.builderPaneBody}>No messages in this chat yet.</Text>
                    ) : (
                      activeThreadMessages.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.messageBubble,
                            item.senderId === authUser?.id
                              ? styles.messageBubbleMine
                              : styles.messageBubbleOther,
                          ]}
                        >
                          <Text style={styles.messageBubbleText}>{item.body}</Text>
                        </View>
                      ))
                    )}
                  </View>
                  <View style={styles.messageComposerRow}>
                    <TextInput
                      value={messageBody}
                      onChangeText={setMessageBody}
                      placeholder="Write a message..."
                      style={styles.messageComposerInput}
                    />
                    <Pressable style={styles.messageSendBtn} onPress={sendMessage}>
                      <Text style={styles.messageSendText}>Send</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
            {!!messageStatus && <Text style={styles.messageStatusText}>{messageStatus}</Text>}
            <Pressable style={styles.primaryButton} onPress={resetToLogin}>
              <Text style={styles.primaryText}>Logout</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeLight: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
  },
  containerLogin: {
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 18,
  },
  containerSignup: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  containerBuilder: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  loginShell: {
    flex: 1,
    gap: 18,
    backgroundColor: '#FFFFFF',
  },
  loginLogoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  loginLogo: {
    width: 300,
    height: 150,
  },
  loginLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    padding: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#111111',
  },
  loginButton: {
    padding: 16,
    backgroundColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: BRAND_BLUE,
    fontWeight: '800',
  },
  signupFromLoginButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: BRAND_BLUE,
  },
  signupFromLoginText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#111111',
  },
  brand: {
    color: '#FACC15',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  signupContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    gap: 14,
  },
  signupTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111111',
  },
  signupRoleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#111111',
  },
  signupRoleButtonActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  signupRoleText: {
    fontWeight: '800',
    color: '#111111',
  },
  signupRoleTextActive: {
    color: BRAND_BLUE,
  },
  signupSubmitButton: {
    padding: 16,
    backgroundColor: '#111111',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signupSubmitText: {
    color: BRAND_BLUE,
    fontWeight: '800',
  },
  backToLoginText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#111111',
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#E5E7EB',
    marginBottom: 12,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '700',
    color: '#111111',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    padding: 14,
    color: '#111111',
  },
  fieldInputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  roleButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: BRAND_BLUE,
    borderColor: BRAND_BLUE,
  },
  roleText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#111827',
  },
  builderScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  builderContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 20,
  },
  builderHeader: {
    gap: 6,
  },
  builderWelcome: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  builderCompany: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111111',
  },
  builderStatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  builderActionsWrap: {
    gap: 12,
  },
  builderActionsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  builderStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111111',
  },
  builderStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  builderStatTitle: {
    marginTop: 6,
    opacity: 0.7,
    fontWeight: '700',
    color: '#111111',
  },
  builderActionButton: {
    padding: 16,
    borderRadius: 16,
  },
  builderActionButtonDark: {
    backgroundColor: '#111111',
  },
  builderActionButtonBrand: {
    backgroundColor: BRAND_BLUE,
  },
  builderActionLabel: {
    fontWeight: '900',
    fontSize: 16,
  },
  builderActionLabelDark: {
    color: '#333333',
  },
  builderActionLabelBrand: {
    color: BRAND_BLUE,
  },
  builderActionSubtitle: {
    marginTop: 4,
    fontWeight: '600',
  },
  builderActionSubtitleDark: {
    color: '#444444',
  },
  builderActionSubtitleBrand: {
    color: BRAND_BLUE,
  },
  builderTabPane: {
    marginTop: 60,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  builderPaneTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  builderPaneBody: {
    marginTop: 8,
    color: '#333333',
    fontSize: 15,
  },
  jobsPage: {
    gap: 14,
  },
  builderSectionPage: {
    gap: 14,
  },
  builderSectionCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  messagesLayout: {
    gap: 12,
  },
  messagesListCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  messageThreadRow: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 2,
  },
  messageThreadRowActive: {
    backgroundColor: '#CCFBF1',
  },
  messageThreadName: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 14,
  },
  messageThreadSubtitle: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  messagesDetailCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  messagesDetailTitle: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
  },
  messagesListWrap: {
    gap: 8,
  },
  messageBubble: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '92%',
  },
  messageBubbleMine: {
    backgroundColor: BRAND_BLUE,
    alignSelf: 'flex-end',
  },
  messageBubbleOther: {
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  messageBubbleText: {
    color: '#111111',
    fontWeight: '600',
    lineHeight: 18,
  },
  messageComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageComposerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#111111',
  },
  messageSendBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111111',
  },
  messageSendText: {
    color: BRAND_BLUE,
    fontWeight: '800',
  },
  messageStatusText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  tradieStartCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  messageSectionTitle: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
  },
  tradieStartRow: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  messageStartAction: {
    color: '#111111',
    fontWeight: '800',
  },
  profileFields: {
    gap: 12,
  },
  profilePageContent: {
    gap: 2,
  },
  profileSaveBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  profileSaveText: {
    color: BRAND_BLUE,
    fontWeight: '900',
  },
  jobsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  jobsHeaderTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111111',
  },
  postJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_BLUE,
    borderWidth: 1,
    borderColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  postJobButtonText: {
    color: '#111111',
    fontWeight: '800',
  },
  jobsStatusTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  jobsStatusTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  jobsStatusTabButtonActive: {
    backgroundColor: '#111111',
  },
  jobsStatusTabText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 13,
  },
  jobsStatusTabTextActive: {
    color: BRAND_BLUE,
  },
  jobsListWrap: {
    gap: 10,
  },
  jobsEmptyState: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 14,
    padding: 14,
    color: '#444444',
  },
  jobCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  jobCardActive: {
    backgroundColor: '#CCFBF1',
  },
  jobCardTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  jobCardMeta: {
    marginTop: 4,
    color: '#444444',
    fontWeight: '600',
  },
  jobDetailsCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  jobDetailsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  jobDetailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobDetailsCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111111',
  },
  jobDetailsCloseText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 12,
  },
  jobDetailsMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
  },
  jobDetailsSubheading: {
    marginTop: 6,
    color: '#111111',
    fontWeight: '800',
  },
  jobDetailsText: {
    color: '#333333',
    lineHeight: 20,
  },
  jobInterestedItem: {
    color: '#333333',
    fontWeight: '600',
  },
  builderLogoutBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  builderLogoutText: {
    color: BRAND_BLUE,
    fontWeight: '900',
  },
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bottomTabIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabText: {
    fontWeight: '700',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryText: {
    color: '#052E16',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: BRAND_BLUE,
    fontSize: 14,
  },
  homeTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  homeBody: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#111111',
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111',
  },
  modalSubtitle: {
    color: '#444444',
    lineHeight: 20,
    marginBottom: 2,
  },
  modalLabel: {
    color: '#111111',
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#111111',
  },
  modalInputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalButtonSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
  },
  modalButtonSecondaryText: {
    color: '#111111',
    fontWeight: '700',
  },
  modalButtonPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#111111',
  },
  modalButtonPrimaryText: {
    color: BRAND_BLUE,
    fontWeight: '800',
  },
});

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address';
};

function Field({
  label,
  multiline,
  ...rest
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
      />
    </View>
  );
}

function BuilderStatCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.builderStatCard}>
      <Text style={styles.builderStatValue}>{value}</Text>
      <Text style={styles.builderStatTitle}>{title}</Text>
    </View>
  );
}

function BuilderActionButton({
  label,
  subtitle,
  onPress,
  tone,
}: {
  label: string;
  subtitle: string;
  onPress?: () => void;
  tone?: 'default' | 'brand';
}) {
  const isBrand = tone === 'brand';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.builderActionButton,
        isBrand ? styles.builderActionButtonBrand : styles.builderActionButtonDark,
      ]}
    >
      <Text
        style={[
          styles.builderActionLabel,
          isBrand ? styles.builderActionLabelDark : styles.builderActionLabelBrand,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.builderActionSubtitle,
          isBrand
            ? styles.builderActionSubtitleDark
            : styles.builderActionSubtitleBrand,
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}
