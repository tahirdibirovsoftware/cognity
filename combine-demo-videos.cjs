const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function combineVideos() {
  const managerVideo = path.join(__dirname, 'public', 'cognity-manager-demo.mp4');
  const employeeVideo = path.join(__dirname, 'public', 'cognity-employee-demo.mp4');
  const fullVideoPublic = path.join(__dirname, 'public', 'cognity-full-demo.mp4');
  const artifactDir = '/home/tahirdibirov/.gemini/antigravity-cli/brain/fa663af3-af51-489d-b6fe-7a5fb470cd9c';
  const artifactFullVideo = path.join(artifactDir, 'cognity-full-demo.mp4');

  if (!fs.existsSync(managerVideo) || !fs.existsSync(employeeVideo)) {
    throw new Error('Manager or Employee demo video not found in public/ directory.');
  }

  const listFile = path.join(__dirname, 'temp_concat_list.txt');
  fs.writeFileSync(listFile, `file '${managerVideo}'\nfile '${employeeVideo}'\n`);

  console.log('Concatenating videos into cognity-full-demo.mp4...');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy -movflags +faststart "${fullVideoPublic}"`);
  fs.unlinkSync(listFile);

  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(fullVideoPublic, artifactFullVideo);
  }

  console.log('Combined video successfully created at:');
  console.log(' - ' + fullVideoPublic);
  if (fs.existsSync(artifactDir)) {
    console.log(' - ' + artifactFullVideo);
  }
}

combineVideos();
