import React from 'react';
import { articleData } from '../data';

export default function ArticleView() {
  return (
    <section className="view-section active">
      <div className="article-container glass-panel">
        <header className="article-header">
          <span className="badge">Artigo Guia</span>
          <h1>{articleData.title}</h1>
          <div className="article-meta">
            <span className="author">{articleData.author}</span>
            <span className="dot">•</span>
            <span className="date">{articleData.date}</span>
          </div>
        </header>
        <div 
          className="article-body"
          dangerouslySetInnerHTML={{ __html: articleData.content }}
        />
      </div>
    </section>
  );
}
