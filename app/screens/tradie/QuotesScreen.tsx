import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import type { QuoteStatus, TradieQuoteLineItem } from '../../types';
import { styles } from '../../styles';

type QuoteLineItemInput = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function TradieQuotesScreen() {
  const { tradieJobs, tradieQuotes, addTradieQuote, quotesStatusTab, setQuotesStatusTab } = useApp();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [selectedQuoteJobId, setSelectedQuoteJobId] = useState<number | null>(null);
  const [siteAddress, setSiteAddress] = useState('');
  const [scope, setScope] = useState('');
  const [validForDays, setValidForDays] = useState('14');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<QuoteLineItemInput[]>([
    { id: 1, description: '', quantity: '1', unitPrice: '' },
  ]);

  const enquiredJobs = useMemo(() => tradieJobs.filter((job) => job.hasEnquired), [tradieJobs]);
  const selectedQuoteJob = enquiredJobs.find((job) => job.id === selectedQuoteJobId) || null;
  const visibleQuotes = tradieQuotes.filter((quote) => quote.status === quotesStatusTab);
  const subtotal = lineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const resetCreateForm = () => {
    setCreateModalVisible(false);
    setJobDropdownOpen(false);
    setSelectedQuoteJobId(null);
    setSiteAddress('');
    setScope('');
    setValidForDays('14');
    setNotes('');
    setLineItems([{ id: Date.now(), description: '', quantity: '1', unitPrice: '' }]);
  };

  const openCreateModal = () => {
    if (!enquiredJobs.length) {
      Alert.alert('No jobs available', 'You can only create a quote for jobs you have already enquired about.');
      return;
    }
    setCreateModalVisible(true);
  };

  const updateLineItem = (id: number, key: 'description' | 'quantity' | 'unitPrice', value: string) => {
    setLineItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addLineItemRow = () => {
    setLineItems((current) => [...current, { id: Date.now(), description: '', quantity: '1', unitPrice: '' }]);
  };

  const removeLineItemRow = (id: number) => {
    setLineItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const createPdfQuote = async (params: {
    quoteNumber: string;
    jobTitle: string;
    builderDisplayName: string;
    siteAddress: string;
    scope: string;
    validForDays: number;
    notes: string;
    lineItems: TradieQuoteLineItem[];
    subtotal: number;
    gst: number;
    total: number;
  }) => {
    try {
      const Print = require('expo-print') as {
        printToFileAsync: (options: { html: string }) => Promise<{ uri: string }>;
      };
      const logoUri = Image.resolveAssetSource(require('../../../assets/tradielink-logo.png')).uri;
      const today = new Date().toLocaleDateString('en-AU');
      const lineItemsMarkup = params.lineItems
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.description)}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>`,
        )
        .join('');
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; color: #111111; padding: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;">
              <img src="${logoUri}" style="width: 180px; height: auto;" />
              <div style="text-align: right;">
                <h1 style="margin: 0; font-size: 22px;">QUOTE</h1>
                <p style="margin: 4px 0 0 0;">${escapeHtml(params.quoteNumber)}</p>
                <p style="margin: 4px 0 0 0;">Issued: ${today}</p>
              </div>
            </div>
            <p><strong>Job:</strong> ${escapeHtml(params.jobTitle)}</p>
            <p><strong>Builder:</strong> ${escapeHtml(params.builderDisplayName)}</p>
            <p><strong>Site Address:</strong> ${escapeHtml(params.siteAddress || 'Not specified')}</p>
            <p><strong>Scope:</strong> ${escapeHtml(params.scope)}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 14px;">
              <thead>
                <tr>
                  <th style="text-align: left; border-bottom: 1px solid #111111; padding: 8px;">Item</th>
                  <th style="text-align: left; border-bottom: 1px solid #111111; padding: 8px;">Qty</th>
                  <th style="text-align: left; border-bottom: 1px solid #111111; padding: 8px;">Unit</th>
                  <th style="text-align: left; border-bottom: 1px solid #111111; padding: 8px;">Amount</th>
                </tr>
              </thead>
              <tbody>${lineItemsMarkup}</tbody>
            </table>
            <div style="margin-top: 14px; text-align: right;">
              <p><strong>Subtotal:</strong> ${formatCurrency(params.subtotal)}</p>
              <p><strong>GST (10%):</strong> ${formatCurrency(params.gst)}</p>
              <p style="font-size: 18px;"><strong>Total:</strong> ${formatCurrency(params.total)}</p>
            </div>
            <p><strong>Validity:</strong> ${params.validForDays} days</p>
            <p><strong>Notes:</strong> ${escapeHtml(params.notes || 'N/A')}</p>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html });

      try {
        const Sharing = require('expo-sharing') as {
          isAvailableAsync: () => Promise<boolean>;
          shareAsync: (uri: string) => Promise<void>;
        };
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri);
        }
      } catch (_error) {
        // Sharing is optional; PDF generation still succeeds without it.
      }

      return uri;
    } catch (_error) {
      Alert.alert(
        'PDF generation unavailable',
        'Install expo-print (and optional expo-sharing) to generate and share quote PDFs.',
      );
      return null;
    }
  };

  const openExistingPdf = async (pdfUri: string | null) => {
    if (!pdfUri) {
      Alert.alert('No PDF file', 'This quote does not have a generated PDF file yet.');
      return;
    }
    try {
      const Sharing = require('expo-sharing') as {
        isAvailableAsync: () => Promise<boolean>;
        shareAsync: (uri: string) => Promise<void>;
      };
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing unavailable', 'PDF sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(pdfUri);
    } catch (_error) {
      Alert.alert('Unable to open PDF', 'Install expo-sharing to open or share generated PDFs.');
    }
  };

  const createQuote = async () => {
    if (!selectedQuoteJob) {
      Alert.alert('Missing info', 'Select a job before creating the quote.');
      return;
    }
    if (!scope.trim()) {
      Alert.alert('Missing info', 'Add a scope of work.');
      return;
    }

    const normalizedLineItems = lineItems
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
      .filter((item) => item.description && item.quantity > 0 && item.unitPrice >= 0);

    if (!normalizedLineItems.length) {
      Alert.alert('Missing info', 'Add at least one valid line item with quantity and unit price.');
      return;
    }

    const normalizedSubtotal = normalizedLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const normalizedGst = normalizedSubtotal * 0.1;
    const normalizedTotal = normalizedSubtotal + normalizedGst;
    const normalizedValidForDays = Number(validForDays) > 0 ? Number(validForDays) : 14;
    const quoteNumber = `TLQ-${Date.now().toString().slice(-6)}`;

    const pdfUri = await createPdfQuote({
      quoteNumber,
      jobTitle: selectedQuoteJob.title,
      builderDisplayName: selectedQuoteJob.builderDisplayName,
      siteAddress,
      scope,
      validForDays: normalizedValidForDays,
      notes,
      lineItems: normalizedLineItems,
      subtotal: normalizedSubtotal,
      gst: normalizedGst,
      total: normalizedTotal,
    });

    addTradieQuote({
      id: Date.now(),
      quoteNumber,
      jobId: selectedQuoteJob.id,
      jobTitle: selectedQuoteJob.title,
      builderDisplayName: selectedQuoteJob.builderDisplayName,
      siteAddress: siteAddress.trim(),
      scope: scope.trim(),
      lineItems: normalizedLineItems,
      subtotal: normalizedSubtotal,
      gst: normalizedGst,
      total: normalizedTotal,
      validForDays: normalizedValidForDays,
      notes: notes.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      pdfUri,
    });
    setQuotesStatusTab('pending');
    Alert.alert('Quote created', pdfUri ? 'Quote PDF generated successfully.' : 'Quote saved without a PDF file.');
    resetCreateForm();
  };

  return (
    <View style={styles.builderSectionPage}>
      <View style={styles.jobsHeaderRow}>
        <Text style={styles.jobsHeaderTitle}>Quotes</Text>
        <Pressable style={styles.quoteCornerAddButton} onPress={openCreateModal}>
          <Ionicons name="add" size={18} color="#111111" />
        </Pressable>
      </View>
      <View style={styles.jobsStatusTabs}>
        {(['pending', 'declined', 'approved'] as QuoteStatus[]).map((status) => {
          const active = quotesStatusTab === status;
          const label = status === 'pending' ? 'Pending' : status === 'declined' ? 'Declined' : 'Approved';
          return (
            <Pressable
              key={status}
              onPress={() => setQuotesStatusTab(status)}
              style={[styles.jobsStatusTabButton, active && styles.jobsStatusTabButtonActive]}
            >
              <Text style={[styles.jobsStatusTabText, active && styles.jobsStatusTabTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.builderSectionCard}>
        {!visibleQuotes.length ? (
          <Text style={styles.builderPaneBody}>
            {quotesStatusTab === 'pending'
              ? 'No pending quotes yet. Tap Create Quote to generate one.'
              : quotesStatusTab === 'declined'
                ? 'No declined quotes yet.'
                : 'No approved quotes yet.'}
          </Text>
        ) : (
          <View style={styles.jobsListWrap}>
            {visibleQuotes.map((quote) => (
              <View key={quote.id} style={styles.jobCard}>
                <Text style={styles.jobCardTitle}>{quote.quoteNumber}</Text>
                <Text style={styles.jobCardMeta}>{quote.jobTitle}</Text>
                <Text style={styles.messageThreadSubtitle}>{quote.builderDisplayName}</Text>
                <Text style={styles.jobCardMeta}>
                  Total: {formatCurrency(quote.total)} | {new Date(quote.createdAt).toLocaleDateString('en-AU')}
                </Text>
                <Pressable style={styles.enquiryMessageBtn} onPress={() => void openExistingPdf(quote.pdfUri)}>
                  <Text style={styles.enquiryMessageText}>Open PDF</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={resetCreateForm}>
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.quoteModalScroll} contentContainerStyle={styles.quoteModalContent}>
            <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Quote</Text>
            <Text style={styles.modalSubtitle}>Build a professional quote and export it as a PDF.</Text>

            <Text style={styles.modalLabel}>Job</Text>
            <Pressable style={styles.modalInput} onPress={() => setJobDropdownOpen((open) => !open)}>
              <Text style={styles.modalDropdownText}>{selectedQuoteJob ? selectedQuoteJob.title : 'Select a job'}</Text>
            </Pressable>
            {jobDropdownOpen && (
              <View style={styles.tradeDropdownMenu}>
                {enquiredJobs.map((job) => (
                  <Pressable
                    key={job.id}
                    style={[
                      styles.tradeDropdownItem,
                      selectedQuoteJobId === job.id && styles.tradeDropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedQuoteJobId(job.id);
                      setJobDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.tradeDropdownItemText,
                        selectedQuoteJobId === job.id && styles.tradeDropdownItemTextSelected,
                      ]}
                    >
                      {job.title}
                    </Text>
                    <Text style={styles.messageThreadSubtitle}>{job.builderDisplayName}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.modalLabel}>Site Address</Text>
            <TextInput
              value={siteAddress}
              onChangeText={setSiteAddress}
              placeholder="Job site address"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Scope Of Work</Text>
            <TextInput
              value={scope}
              onChangeText={setScope}
              placeholder="Describe what is included..."
              style={[styles.modalInput, styles.modalInputMultiline]}
              multiline
            />

            <Text style={styles.modalLabel}>Line Items</Text>
            <View style={styles.quoteItemsWrap}>
              {lineItems.map((item) => (
                <View key={item.id} style={styles.quoteItemRow}>
                  <TextInput
                    value={item.description}
                    onChangeText={(value) => updateLineItem(item.id, 'description', value)}
                    placeholder="Item"
                    style={[styles.modalInput, styles.quoteItemDescription]}
                  />
                  <TextInput
                    value={item.quantity}
                    onChangeText={(value) => updateLineItem(item.id, 'quantity', value)}
                    placeholder="Qty"
                    keyboardType="numeric"
                    style={[styles.modalInput, styles.quoteItemSmallInput]}
                  />
                  <TextInput
                    value={item.unitPrice}
                    onChangeText={(value) => updateLineItem(item.id, 'unitPrice', value)}
                    placeholder="Unit $"
                    keyboardType="numeric"
                    style={[styles.modalInput, styles.quoteItemSmallInput]}
                  />
                  <Pressable style={styles.quoteItemDeleteBtn} onPress={() => removeLineItemRow(item.id)}>
                    <Ionicons name="trash-outline" size={15} color="#111111" />
                  </Pressable>
                </View>
              ))}
            </View>
            <Pressable style={styles.quoteAddItemBtn} onPress={addLineItemRow}>
              <Ionicons name="add-circle-outline" size={16} color="#111111" />
              <Text style={styles.quoteAddItemText}>Add line item</Text>
            </Pressable>

            <View style={styles.quoteTotalsWrap}>
              <Text style={styles.quoteTotalText}>Subtotal: {formatCurrency(subtotal)}</Text>
              <Text style={styles.quoteTotalText}>GST (10%): {formatCurrency(gst)}</Text>
              <Text style={styles.quoteTotalMain}>Total: {formatCurrency(total)}</Text>
            </View>

            <Text style={styles.modalLabel}>Quote Valid (Days)</Text>
            <TextInput
              value={validForDays}
              onChangeText={setValidForDays}
              placeholder="14"
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes/terms"
              style={[styles.modalInput, styles.modalInputMultiline]}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalButtonSecondary} onPress={resetCreateForm}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonPrimary} onPress={() => void createQuote()}>
                <Text style={styles.modalButtonPrimaryText}>Generate PDF Quote</Text>
              </Pressable>
            </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
