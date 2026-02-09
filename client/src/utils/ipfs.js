import { create } from 'kubo-rpc-client';

// WARNING: Storing API keys in client-side code is a major security risk.
// This key is visible to anyone inspecting the site's code.
// For a production application, this functionality should be moved to a backend server
// where the API key can be kept secret.
const auth = 'Basic MlF4SnlMZ0MwZjRDAmpQRU5tOHRUa0Y0eGNuOjY2Yzg3ZjEzYjE4NWYzNDI3OTA2OTM1MjE2ZTliODBi';

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

export const uploadToIPFS = async (file) => {
  try {
    const added = await client.add(file);
    // The smart contract expects only the IPFS hash (CID), not the full URL.
    return added.path;
  } catch (error) {
    console.error('Error uploading file to IPFS: ', error);
    // Re-throw the error so the calling function can handle it and show a message to the user.
    throw error;
  }
};
