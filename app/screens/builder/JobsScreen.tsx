import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { TRADE_OPTIONS } from '../../config/constants';
import { useApp } from '../../context/AppContext';
import type { JobStatus, TradeOption } from '../../types';
import { styles } from '../../styles';

export function BuilderJobsScreen() {
  const {
    selectedJob,
    setSelectedJobId,
    openPostJobModal,
    jobsStatusTab,
    setJobsStatusTab,
    visibleJobs,
    startBuilderChat,
    postJobModalVisible,
    closePostJobModal,
    newJobTitle,
    setNewJobTitle,
    newJobLocation,
    setNewJobLocation,
    tradesDropdownOpen,
    setTradesDropdownOpen,
    newJobTradesNeeded,
    toggleTradeNeeded,
    newJobDetails,
    setNewJobDetails,
    createJob,
  } = useApp();

  return (
    <View style={styles.jobsPage}>
      {!selectedJob ? (
        <>
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
              const label = status === 'posted' ? 'Posted' : status === 'inProgress' ? 'In Progress' : 'Done';
              return (
                <Pressable
                  key={status}
                  onPress={() => {
                    setSelectedJobId(null);
                    setJobsStatusTab(status);
                  }}
                  style={[styles.jobsStatusTabButton, active && styles.jobsStatusTabButtonActive]}
                >
                  <Text style={[styles.jobsStatusTabText, active && styles.jobsStatusTabTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.jobsListWrap}>
            {visibleJobs.length === 0 ? (
              <Text style={styles.jobsEmptyState}>No jobs in this tab yet.</Text>
            ) : (
              visibleJobs.map((job) => (
                <Pressable key={job.id} style={styles.jobCard} onPress={() => setSelectedJobId(job.id)}>
                  <Text style={styles.jobCardTitle}>{job.title}</Text>
                  <Text style={styles.jobCardMeta}>{job.location || 'Location not set'}</Text>
                </Pressable>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.jobDetailsPage}>
          <Pressable style={styles.jobBackButton} onPress={() => setSelectedJobId(null)}>
            <Ionicons name="chevron-back" size={16} color="#111111" />
            <Text style={styles.jobBackButtonText}>Back</Text>
          </Pressable>

          <View style={styles.jobDetailsCard}>
            <Text style={styles.jobDetailsTitle}>Job Details</Text>
            <Text style={styles.jobDetailsMainTitle}>{selectedJob.title}</Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Location: </Text>
              {selectedJob.location || 'Location not set'}
            </Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Trades Needed: </Text>
              {selectedJob.tradesNeeded.length ? selectedJob.tradesNeeded.join(', ') : 'Not specified'}
            </Text>
            <Text style={styles.jobDetailsText}>
              <Text style={styles.jobFieldLabel}>Description: </Text>
              {selectedJob.details || 'No details added yet.'}
            </Text>
          </View>

          <View style={styles.jobDetailsCard}>
            <Text style={styles.jobDetailsTitle}>Enquiries</Text>
            {selectedJob.enquiries.length === 0 ? (
              <Text style={styles.jobDetailsText}>No tradies have enquired about this job yet.</Text>
            ) : (
              selectedJob.enquiries.map((enquiry) => (
                <View key={enquiry.id} style={styles.enquiryRow}>
                  <View style={styles.enquiryTextWrap}>
                    <Text style={styles.enquiryName}>{enquiry.name}</Text>
                    {!!enquiry.occupation && <Text style={styles.enquiryOccupation}>{enquiry.occupation}</Text>}
                  </View>
                  <Pressable style={styles.enquiryMessageBtn} onPress={() => startBuilderChat(enquiry.id)}>
                    <Text style={styles.enquiryMessageText}>Message</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      <Modal visible={postJobModalVisible} transparent animationType="slide" onRequestClose={closePostJobModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Post a Job</Text>

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

            <Text style={styles.modalLabel}>Trades Needed</Text>
            <Pressable style={styles.modalInput} onPress={() => setTradesDropdownOpen((open) => !open)}>
              <Text style={styles.modalDropdownText}>
                {newJobTradesNeeded.length ? newJobTradesNeeded.join(', ') : 'Select trades'}
              </Text>
            </Pressable>
            {tradesDropdownOpen && (
              <View style={styles.tradeDropdownMenu}>
                {TRADE_OPTIONS.map((trade) => {
                  const selected = newJobTradesNeeded.includes(trade);
                  return (
                    <Pressable
                      key={trade}
                      style={[styles.tradeDropdownItem, selected && styles.tradeDropdownItemSelected]}
                      onPress={() => toggleTradeNeeded(trade as TradeOption)}
                    >
                      <Text style={[styles.tradeDropdownItemText, selected && styles.tradeDropdownItemTextSelected]}>
                        {trade}
                      </Text>
                      {selected && <Ionicons name="checkmark" size={16} color="#111111" />}
                    </Pressable>
                  );
                })}
              </View>
            )}

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
    </View>
  );
}
