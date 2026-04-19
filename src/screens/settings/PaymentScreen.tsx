import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  CardField,
  useStripe,
  usePlatformPay,
  PlatformPayButton,
  PlatformPay,
  CardFieldInput,
} from '@stripe/stripe-react-native';
import { theme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { PaymentService } from '../../services/PaymentService';
import { supabase } from '../../services/supabase';

const HOW_IT_WORKS = [
  {
    icon: 'checkmark-circle' as const,
    color: '#22C55E',
    bg: '#DCFCE7',
    title: 'Hit your goal',
    desc: 'No charge. Your money stays exactly where it is.',
  },
  {
    icon: 'close-circle' as const,
    color: theme.colors.error,
    bg: '#FEE2E2',
    title: 'Miss your goal',
    desc: 'Your stake is charged and donated to your chosen charity.',
  },
  {
    icon: 'flame' as const,
    color: theme.colors.primary,
    bg: theme.colors.primaryFaded,
    title: '7-day streak bonus',
    desc: 'Win 7 days in a row and earn your full stake back.',
  },
];

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { stakeAmount } = useOnboardingStore();
  const { createPaymentMethod } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPaySetupIntent } = usePlatformPay();

  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applePayLoading, setApplePayLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [applePaySupported, setApplePaySupported] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('payment_method_id').eq('id', user.id).single(),
      isPlatformPaySupported(),
    ]).then(([{ data }, supported]) => {
      const hasSaved = !!(data as any)?.payment_method_id;
      setHasPaymentMethod(hasSaved);
      setShowCardForm(!hasSaved && !supported);
      setApplePaySupported(supported);
      setLoading(false);
    });
  }, [user]);

  const onSaveSuccess = () => {
    setHasPaymentMethod(true);
    setShowCardForm(false);
    Alert.alert(
      'Payment method saved',
      "You're all set. You'll only be charged when you miss your goal."
    );
  };

  const handleApplePay = async () => {
    if (!user) return;
    setApplePayLoading(true);
    try {
      const { clientSecret, error: siError } = await PaymentService.createSetupIntent(user.id);
      if (siError || !clientSecret) {
        Alert.alert('Error', siError ?? 'Could not start Apple Pay.');
        return;
      }

      const { error, setupIntent } = await confirmPlatformPaySetupIntent(clientSecret, {
        applePay: {
          cartItems: [{ label: 'scroli – save card', amount: '0.00', paymentType: PlatformPay.PaymentType.Immediate }],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
        },
      });

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Apple Pay failed', error.localizedMessage ?? error.message);
        }
        return;
      }

      if (setupIntent?.paymentMethodId) {
        const result = await PaymentService.savePaymentMethod(user.id, setupIntent.paymentMethodId);
        if (result.success) onSaveSuccess();
        else Alert.alert('Error', result.error ?? 'Could not save payment method.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setApplePayLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!user || !cardComplete) return;
    setSaving(true);
    try {
      const { paymentMethod, error } = await createPaymentMethod({ paymentMethodType: 'Card' });
      if (error || !paymentMethod) {
        Alert.alert('Error', error?.message ?? 'Could not read card details.');
        return;
      }
      const result = await PaymentService.savePaymentMethod(user.id, paymentMethod.id);
      if (result.success) onSaveSuccess();
      else Alert.alert('Error', result.error ?? 'Could not save your card.');
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* How it works */}
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          <View style={styles.howCard}>
            {HOW_IT_WORKS.map((item, i) => (
              <View key={i} style={[styles.howRow, i > 0 && styles.howRowBorder]}>
                <View style={[styles.howIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.howText}>
                  <Text style={styles.howTitle}>{item.title}</Text>
                  <Text style={styles.howDesc}>
                    {item.title === 'Miss your goal'
                      ? `$${stakeAmount} charged and donated to your chosen charity.`
                      : item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Saved method */}
          {hasPaymentMethod && (
            <>
              <Text style={styles.sectionLabel}>ACTIVE METHOD</Text>
              <View style={styles.savedCard}>
                <View style={styles.savedLeft}>
                  <View style={styles.savedIconWrap}>
                    <Ionicons name="card" size={20} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.savedTitle}>Card on file</Text>
                    <Text style={styles.savedSub}>Ready to charge on missed goals</Text>
                  </View>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
            </>
          )}

          {/* Payment options */}
          <Text style={styles.sectionLabel}>
            {hasPaymentMethod ? 'UPDATE METHOD' : 'ADD PAYMENT METHOD'}
          </Text>

          {/* Apple Pay */}
          {applePaySupported && (
            <>
              {applePayLoading ? (
                <View style={styles.applePayLoading}>
                  <ActivityIndicator color={theme.colors.text.primary} />
                </View>
              ) : (
                <PlatformPayButton
                  onPress={handleApplePay}
                  type={PlatformPay.ButtonType.SetUp}
                  appearance={PlatformPay.ButtonStyle.Black}
                  borderRadius={12}
                  style={styles.applePayButton}
                />
              )}

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or pay with card</Text>
                <View style={styles.orLine} />
              </View>
            </>
          )}

          {/* Card form toggle */}
          {!showCardForm && (
            <Pressable style={styles.addCardRow} onPress={() => setShowCardForm(true)}>
              <View style={styles.addCardIcon}>
                <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.addCardText}>
                {hasPaymentMethod ? 'Update card' : 'Add a card'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text.light} />
            </Pressable>
          )}

          {showCardForm && (
            <View style={styles.cardFormCard}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: '4242 4242 4242 4242' }}
                cardStyle={cardFieldStyle}
                style={styles.cardField}
                onCardChange={(d: CardFieldInput.Details) => setCardComplete(d.complete)}
              />
              <Pressable
                style={[styles.saveButton, (!cardComplete || saving) && styles.saveButtonDisabled]}
                onPress={handleSaveCard}
                disabled={!cardComplete || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {hasPaymentMethod ? 'Update card' : 'Save card'}
                  </Text>
                )}
              </Pressable>
              {(hasPaymentMethod || applePaySupported) && (
                <Pressable style={styles.cancelButton} onPress={() => setShowCardForm(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Security footer */}
          <View style={styles.securityRow}>
            <Ionicons name="lock-closed-outline" size={13} color={theme.colors.text.light} />
            <Text style={styles.securityText}>256-bit encryption · Powered by Stripe · PCI DSS compliant</Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const cardFieldStyle: CardFieldInput.Styles = {
  backgroundColor: theme.colors.cream,
  textColor: '#1F2937',
  placeholderColor: '#9CA3AF',
  borderRadius: 10,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { width: 40 },
  headerTitle: {
    fontSize: theme.typography.fontSize.h3,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: theme.spacing.md, gap: 0 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.light,
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },

  // How it works
  howCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  howRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  howIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  howText: { flex: 1 },
  howTitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  howDesc: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.small * 1.5,
  },

  // Saved method
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#22C55E33',
    ...theme.shadows.sm,
  },
  savedLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  savedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors.text.primary,
  },
  savedSub: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#16A34A',
  },

  // Apple Pay
  applePayButton: {
    width: '100%',
    height: 52,
  },
  applePayLoading: {
    height: 52,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  orLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  orText: {
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.light,
  },

  // Card option row
  addCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  addCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    flex: 1,
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },

  // Card form
  cardFormCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardField: { width: '100%', height: 52, marginBottom: theme.spacing.sm },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#FFFFFF',
  },
  cancelButton: { alignItems: 'center', paddingVertical: theme.spacing.xs },
  cancelText: {
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },

  // Security
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  securityText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.light,
    textAlign: 'center',
  },
});
