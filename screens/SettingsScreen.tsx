import { View, Text, Button } from 'react-native';
import { testFirebaseConnection } from '@/utils/firebaseTest';

export default function SettingsScreen() {
  const [testResult, setTestResult] = useState<string>('');

  const runFirebaseTest = async () => {
    try {
      const result = await testFirebaseConnection();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Button 
        title="Test Firebase Connection" 
        onPress={runFirebaseTest} 
      />
      <Text style={styles.resultText}>
        {testResult}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  resultText: {
    marginTop: 16,
    fontFamily: 'monospace',
  },
}); 