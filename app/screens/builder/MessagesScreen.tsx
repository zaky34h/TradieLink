import { Pressable, Text, TextInput, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';

export function BuilderMessagesScreen() {
  const {
    directoryTradies,
    startBuilderChat,
    threads,
    activeThreadId,
    builderMessagesView,
    setBuilderMessagesView,
    openThread,
    backFromThread,
    closeActiveThread,
    activeThread,
    activeThreadMessages,
    authUser,
    messageBody,
    handleMessageBodyChange,
    sendMessage,
    messageStatus,
    meTyping,
    peerTyping,
  } = useApp();

  if (activeThread) {
    return (
      <View style={styles.builderSectionPage}>
        <Text style={styles.jobsHeaderTitle}>Messages</Text>
        <View style={styles.messageTabs}>
          <Pressable
            style={[styles.messageTabButton, builderMessagesView === 'active' && styles.messageTabButtonActive]}
            onPress={() => setBuilderMessagesView('active')}
          >
            <Text style={[styles.messageTabText, builderMessagesView === 'active' && styles.messageTabTextActive]}>
              Active
            </Text>
          </Pressable>
          <Pressable
            style={[styles.messageTabButton, builderMessagesView === 'history' && styles.messageTabButtonActive]}
            onPress={() => setBuilderMessagesView('history')}
          >
            <Text style={[styles.messageTabText, builderMessagesView === 'history' && styles.messageTabTextActive]}>
              History
            </Text>
          </Pressable>
        </View>
        <View style={styles.messagesDetailCard}>
          <View style={styles.messagesDetailHeaderRow}>
            <Pressable style={styles.messageBackBtn} onPress={backFromThread}>
              <Text style={styles.messageBackBtnText}>Back</Text>
            </Pressable>
            <Pressable style={styles.messageCloseBtn} onPress={closeActiveThread}>
              <Text style={styles.messageCloseBtnText}>Close Chat</Text>
            </Pressable>
          </View>
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
                    item.senderId === authUser?.id ? styles.messageBubbleMine : styles.messageBubbleOther,
                  ]}
                >
                  <Text style={styles.messageBubbleText}>{item.body}</Text>
                </View>
              ))
            )}
          </View>
          {peerTyping && <Text style={styles.messageTypingText}>Typing...</Text>}
          {meTyping && !peerTyping && <Text style={styles.messageTypingText}>You are typing...</Text>}
          <View style={styles.messageComposerRow}>
            <TextInput
              value={messageBody}
              onChangeText={handleMessageBodyChange}
              placeholder="Write a message..."
              style={styles.messageComposerInput}
            />
            <Pressable style={styles.messageSendBtn} onPress={sendMessage}>
              <Text style={styles.messageSendText}>Send</Text>
            </Pressable>
          </View>
        </View>
        {!!messageStatus && <Text style={styles.messageStatusText}>{messageStatus}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.builderSectionPage}>
      <Text style={styles.jobsHeaderTitle}>Messages</Text>
      <View style={styles.messageTabs}>
        <Pressable
          style={[styles.messageTabButton, builderMessagesView === 'active' && styles.messageTabButtonActive]}
          onPress={() => setBuilderMessagesView('active')}
        >
          <Text style={[styles.messageTabText, builderMessagesView === 'active' && styles.messageTabTextActive]}>
            Active
          </Text>
        </Pressable>
        <Pressable
          style={[styles.messageTabButton, builderMessagesView === 'history' && styles.messageTabButtonActive]}
          onPress={() => setBuilderMessagesView('history')}
        >
          <Text style={[styles.messageTabText, builderMessagesView === 'history' && styles.messageTabTextActive]}>
            History
          </Text>
        </Pressable>
      </View>
      <View style={styles.tradieStartCard}>
        <Text style={styles.messageSectionTitle}>Start Chat With Tradie</Text>
        {directoryTradies.length === 0 ? (
          <Text style={styles.builderPaneBody}>No tradies available to message yet.</Text>
        ) : (
          directoryTradies.map((tradie) => (
            <Pressable key={tradie.id} style={styles.tradieStartRow} onPress={() => startBuilderChat(tradie.id)}>
              <View>
                <Text style={styles.messageThreadName}>{tradie.displayName}</Text>
                {!!tradie.occupation && <Text style={styles.messageThreadSubtitle}>{tradie.occupation}</Text>}
              </View>
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
                  <View style={styles.messageThreadTopRow}>
                    <Text style={styles.messageThreadName}>{thread.participant.name}</Text>
                    {!!thread.unreadCount && builderMessagesView === 'active' && (
                      <View style={styles.messageUnreadBadge}>
                        <Text style={styles.messageUnreadText}>{thread.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.messageThreadSubtitle}>{thread.lastMessage || 'No messages yet'}</Text>
                </Pressable>
              );
            })
          )}
        </View>
        {!!messageStatus && <Text style={styles.messageStatusText}>{messageStatus}</Text>}
      </View>
    </View>
  );
}
