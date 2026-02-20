import './style.css';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    console.log('Hello WXT content.');
  }
});
