import Path from 'node:path';
import Fs from 'fs-extra';
import Sharp from 'sharp';

const DESIRED_MAX_WIDTH = 120;
const DESIRED_MAX_HEIGHT = 120;

const sourceDir = Path.resolve('./source');
const destinationDir = Path.resolve(sourceDir, 'thumbs');

const files = (await Fs.readdir(sourceDir))
  .filter(
    file => !file.startsWith('.') && // filter out hidden files (beginning with .)
      //Path.extname(file) !== '' && // files with no extension
      ['gif', 'webp'].includes(file.split('.').pop().toLowerCase()) // only pass through files with .webp or .gif file extenstion
  );

Fs.ensureDirSync(destinationDir);

for (let file of files) {
  const sourceFile = Path.resolve(sourceDir, file);
  console.log(file);

  const extNamed = Path.extname(sourceFile);
  console.log(`-> named format: ${extNamed}`);

  let sharpImage = Sharp(sourceFile, { animated: true, pages: -1 }); // supports animated gif and webp images
  let imageMeta = await sharpImage.metadata();
  const extDetected = `.${imageMeta.format}`;
  console.log(`-> detected format: ${extDetected}`);

  if (extNamed === extDetected) {
    console.log('-> format OK');

  } else {
    const fileNew = file.replace(new RegExp(`\\${extNamed}$`), extDetected);
    const destinationFileNew = Path.resolve(sourceDir, fileNew);
    await Fs.rename(sourceFile, destinationFileNew);
    console.log(`-> wrong format, renamed to ${fileNew}`);

    file = fileNew;
    sharpImage = Sharp(destinationFileNew, { animated: true, pages: -1 }); // supports animated gif and webp images
    imageMeta = await sharpImage.metadata();
  }

  const destinationFile = Path.resolve(destinationDir, file);
  if (Fs.pathExistsSync(destinationFile)) {
    console.log(`-> thumbnail for file already exsists: ${file}`);
    continue;
  }

  const { width, height: heightAllPages, size, loop, pages, pageHeight, delay, paletteBitDepth } = imageMeta;
  const height = pageHeight || (heightAllPages / pages); // pageHeight usually only exists for gif, not webp
  const resized = sharpImage.resize({
    width: DESIRED_MAX_WIDTH,
    height: DESIRED_MAX_HEIGHT,
    fit: Sharp.fit.cover
  });
  resized.toFile(destinationFile);
  console.log('-> thumbnail created');
}
