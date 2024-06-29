function replaceDoubleSlash(originalURL: any) {
  try {
    // Step 1: Encode the original URL
    const encodedURL = encodeURIComponent(originalURL);

    // Step 2: Construct the LinkedIn inspection URL
    const linkedInInspectURL = `https://www.linkedin.com/post-inspector/inspect/${encodedURL}`;

    return linkedInInspectURL;
  } catch (error) {
    console.error("Error constructing LinkedIn inspection URL:", error);
    return null;
  }
}

export default replaceDoubleSlash;
