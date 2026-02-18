import { Pressable, ScrollView, Text, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { Field } from '../../components/Field';
import { styles } from '../../styles';

export function SignupScreen() {
  const {
    selectedRole,
    setSelectedRole,
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
    email,
    setEmail,
    password,
    setPassword,
    handleSignup,
    setScreen,
    isTradie,
  } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.signupContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.signupTitle}>Create Account</Text>

      <View style={styles.roleRow}>
        <Pressable
          onPress={() => setSelectedRole('Builder')}
          style={[styles.signupRoleButton, !isTradie && styles.signupRoleButtonActive]}
        >
          <Text style={[styles.signupRoleText, !isTradie && styles.signupRoleTextActive]}>Builder</Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedRole('Tradie')}
          style={[styles.signupRoleButton, isTradie && styles.signupRoleButtonActive]}
        >
          <Text style={[styles.signupRoleText, isTradie && styles.signupRoleTextActive]}>Tradie</Text>
        </Pressable>
      </View>

      <Field label="First Name" value={firstName} onChangeText={setFirstName} />
      <Field label="Last Name" value={lastName} onChangeText={setLastName} />
      <Field label="About Yourself" value={about} onChangeText={setAbout} multiline />

      {!isTradie ? (
        <>
          <Field label="Company Name" value={companyName} onChangeText={setCompanyName} />
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
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <Pressable onPress={handleSignup} style={styles.signupSubmitButton}>
        <Text style={styles.signupSubmitText}>Create Account</Text>
      </Pressable>

      <Pressable onPress={() => setScreen('login')}>
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </Pressable>
    </ScrollView>
  );
}
