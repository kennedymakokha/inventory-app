function getInitials(fullName:string) {
  // Split the string by spaces into an array of words
  const words = fullName.split(' '); 
  let initials = '';

  // Loop through each word and append its first letter to the initials string
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > 0) { // Check for empty strings from multiple spaces
      initials += words[i][0];
    }
  }

  // Convert to uppercase for standard initials formatting
  return initials.toUpperCase(); 
}

export default getInitials;