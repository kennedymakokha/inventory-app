declare module '@react-native-firebase/messaging' {
  import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
  const messaging: () => FirebaseMessagingTypes.Module;
  export default messaging;
}
