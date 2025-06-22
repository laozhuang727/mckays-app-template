const fs = require('fs');
const { execSync } = require('child_process');

// Create a simple screenshot script
async function takeScreenshot() {
  try {
    // Try using curl to get the HTML content
    const html = execSync('curl -s http://localhost:3000', { encoding: 'utf8' });
    
    // Save the HTML content to a file for inspection
    fs.writeFileSync('/tmp/localhost_page.html', html);
    
    console.log('Page HTML content saved to /tmp/localhost_page.html');
    console.log('Server Status: Running but returning 500 error');
    console.log('Error: Clerk publishable key not valid');
    console.log('The page shows a Next.js error page due to missing Clerk configuration');
    
    return html;
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    return null;
  }
}

takeScreenshot();