import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';

export function TradieJobsScreen() {
  const {
    tradieJobs,
    selectedTradieJobId,
    setSelectedTradieJobId,
    selectedTradieJob,
    enquireOnTradieJob,
    startTradieChat,
  } = useApp();

  return (
    <View style={styles.jobsPage}>
      {!selectedTradieJob ? (
        <>
          <View style={styles.jobsHeaderRow}>
            <Text style={styles.jobsHeaderTitle}>Jobs</Text>
          </View>

          <View style={styles.jobsListWrap}>
            {tradieJobs.length === 0 ? (
              <Text style={styles.jobsEmptyState}>No posted jobs available right now.</Text>
            ) : (
              tradieJobs.map((job) => (
                <Pressable key={job.id} style={styles.jobCard} onPress={() => setSelectedTradieJobId(job.id)}>
                  <Text style={styles.jobCardTitle}>{job.title}</Text>
                  <Text style={styles.jobCardMeta}>{job.location || 'Location not set'}</Text>
                  <Text style={styles.messageThreadSubtitle}>{job.builderDisplayName}</Text>
                </Pressable>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.jobDetailsPage}>
          <Pressable style={styles.jobBackButton} onPress={() => setSelectedTradieJobId(null)}>
            <Ionicons name="chevron-back" size={16} color="#111111" />
            <Text style={styles.jobBackButtonText}>Back</Text>
          </Pressable>

          <View style={styles.jobDetailsCard}>
            <Text style={styles.jobDetailsTitle}>Job Details</Text>
            <Text style={styles.jobDetailsMainTitle}>{selectedTradieJob.title}</Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Builder: </Text>
              {selectedTradieJob.builderDisplayName}
            </Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Location: </Text>
              {selectedTradieJob.location || 'Location not set'}
            </Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Trades Needed: </Text>
              {selectedTradieJob.tradesNeeded.length ? selectedTradieJob.tradesNeeded.join(', ') : 'Not specified'}
            </Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Description: </Text>
              {selectedTradieJob.details || 'No details added yet.'}
            </Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Enquiries: </Text>
              {selectedTradieJob.enquiriesCount}
            </Text>
            <Pressable
              style={styles.profileSaveBtn}
              onPress={() => enquireOnTradieJob(selectedTradieJob.id)}
              disabled={selectedTradieJob.hasEnquired}
            >
              <Text style={styles.profileSaveText}>
                {selectedTradieJob.hasEnquired ? 'Enquiry Sent' : 'Enquire on Job'}
              </Text>
            </Pressable>
            <Pressable style={styles.enquiryMessageBtn} onPress={() => startTradieChat(selectedTradieJob.builderId)}>
              <Text style={styles.enquiryMessageText}>Message Builder</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
