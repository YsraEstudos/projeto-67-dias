import fs from 'fs';

const filePath = 'C:\\Users\\israe\\OneDrive\\Documentos\\Projetos\\projeto-67-Dias\\CONCURSO\\src\\styles\\content-modern.css';
let css = fs.readFileSync(filePath, 'utf-8');

css = css.replace(/\.focus-lesson-layout \{[\s\S]*?\}/, `.focus-lesson-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  background: #0e0e0e;
  overflow: hidden;
  animation: fadeInUpFade 0.4s var(--ease-out-expo) forwards;
}`);

css = css.replace(/\.focus-sidebar \{[\s\S]*?\}/, `.focus-sidebar {
  width: 360px;
  min-width: 360px;
  height: 100%;
  background: var(--surface-container-high, #201f1f);
  border-right: none;
  display: flex;
  flex-direction: column;
}`);

css = css.replace(/\.playlist-item\.active \{[\s\S]*?\}/, `.playlist-item.active {
  background: rgba(245, 255, 196, 0.05);
  border-color: transparent;
  box-shadow: inset 4px 0 0 var(--color-primary, #f5ffc4);
}`);

css = css.replace(/\.playlist-item\.active \.playlist-item-icon-button \{[\s\S]*?\}/, `.playlist-item.active .playlist-item-icon-button {
  color: var(--color-primary, #f5ffc4);
}`);

css = css.replace(/\.focus-viewer-main \{[\s\S]*?\}/, `.focus-viewer-main {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background: #0e0e0e;
  position: relative;
  display: flex;
  flex-direction: column;
}`);

const mdInject = `.focus-markdown {
  max-width: 860px;
  margin: 0 auto;
  padding: 64px 40px 120px 40px;
  width: 100%;
  font-family: var(--font-sans, "Manrope", sans-serif);
}

.focus-markdown h1, .focus-markdown h2, .focus-markdown h3, .focus-markdown h4 {
  font-family: var(--font-heading, "Space Grotesk", sans-serif);
  color: #fff;
}

.focus-markdown a {
  color: var(--color-tertiary, #c6fff3);
  text-decoration: none;
  border-bottom: 1px dotted var(--color-tertiary, #c6fff3);
  transition: all 0.2s;
}

.focus-markdown a:hover {
  background: rgba(198, 255, 243, 0.1);
}

.focus-markdown blockquote {
  border-left: 4px solid var(--color-tertiary, #c6fff3);
  padding-left: 16px;
  color: var(--text-muted);
  background: rgba(198, 255, 243, 0.05);
  padding: 16px;
  border-radius: 4px;
}`;

css = css.replace(/\.focus-markdown \{[\s\S]*?\}/, mdInject);

fs.writeFileSync(filePath, css, 'utf-8');
console.log('CSS updated');
