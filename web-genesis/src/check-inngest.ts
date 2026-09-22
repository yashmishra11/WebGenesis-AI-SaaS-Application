async function check() {
  try {
    const res = await fetch('http://localhost:8288');
    console.log('Inngest status:', res.status);
  } catch (err) {
    console.log('Inngest error:', err.message);
  }
}
check();
