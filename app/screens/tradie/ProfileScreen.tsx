import { Pressable, Text, View } from 'react-native';
import { Field } from '../../components/Field';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';

export function TradieProfileScreen() {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    about,
    setAbout,
    occupation,
    setOccupation,
    pricePerHour,
    setPricePerHour,
    experienceYears,
    setExperienceYears,
    certifications,
    setCertifications,
    email,
    setEmail,
    password,
    setPassword,
    saveProfile,
    resetToLogin,
  } = useApp();

  return (
    <View style={styles.builderSectionPage}>
      <Text style={styles.jobsHeaderTitle}>Profile</Text>
      <View style={styles.profilePageContent}>
        <View style={styles.profileFields}>
          <Field label="First Name" value={firstName} onChangeText={setFirstName} />
          <Field label="Last Name" value={lastName} onChangeText={setLastName} />
          <Field label="About Yourself" value={about} onChangeText={setAbout} multiline />
          <Field label="Occupation" value={occupation} onChangeText={setOccupation} />
          <Field label="Price Per Hour" value={pricePerHour} onChangeText={setPricePerHour} keyboardType="numeric" />
          <Field
            label="Experience (Years)"
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="numeric"
          />
          <Field label="Certifications" value={certifications} onChangeText={setCertifications} />
          <Field
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <Pressable style={styles.profileSaveBtn} onPress={saveProfile}>
          <Text style={styles.profileSaveText}>Save Profile</Text>
        </Pressable>
        <Pressable style={styles.builderLogoutBtn} onPress={resetToLogin}>
          <Text style={styles.builderLogoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
