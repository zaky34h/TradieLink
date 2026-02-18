import { Pressable, Text, View } from 'react-native';
import { Field } from '../../components/Field';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles';

export function BuilderProfileScreen() {
  const {
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
          <Field label="Company Name" value={companyName} onChangeText={setCompanyName} />
          <Field label="Address" value={address} onChangeText={setAddress} />
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
