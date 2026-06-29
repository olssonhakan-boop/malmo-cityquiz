const ctx = require.context(
  '../../assets/questions',
  false,
  /\.(jpg|jpeg|png|webp)$/,
);

const QUESTION_IMAGES = {};
ctx.keys().forEach(key => {
  const name = key.replace(/^\.\//, '').replace(/\.(jpg|jpeg|png|webp)$/, '');
  QUESTION_IMAGES[name] = ctx(key);
});

export default QUESTION_IMAGES;
