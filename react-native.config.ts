// // module.exports = {
// //     dependencies: {
// //         "react-native-sqlite-storage": {
// //             platforms: {
// //                 android: {
// //                     sourceDir:
// //                         "../node_modules/react-native-sqlite-storage/platforms/android-native",
// //                     packageImportPath: "import io.liteglue.SQLitePluginPackage;",
// //                     packageInstance: "new SQLitePluginPackage()"
// //                 }
// //             }
// //         }
// //     }
// // };

// // react-native.config.ts
// // react-native.config.ts
// import { Config } from '@react-native-community/cli-types';

// const config: Config = {
//   dependencies: {
//     'react-native-screenshot-prevent': {
//       platforms: {
//         android: null, // Disable autolinking
//       },
//     },
//     // Example of another custom dependency
//     'react-native-sqlite-storage': {
//       name: 'react-native-sqlite-storage',
//       platforms: {
//         android: {
//           sourceDir: '../node_modules/react-native-sqlite-storage/platforms/android-native',
//           packageImportPath: 'import io.liteglue.SQLitePluginPackage;',
//           packageInstance: 'new SQLitePluginPackage()',
//           buildTypes: ['debug', 'release'],
//         },
//       },
//     },
//   },
// };

// export default config;

// react-native.config.ts
import { Config } from '@react-native-community/cli-types';

const config: Config = {
    // dependencies: {
    //     'react-native-screenshot-prevent': {
    //         platforms: {
    //             android: null, // disable autolinking
    //         },
    //     },
    // },
};

export default config;