---
title: "identifying embedding models from raw numerical values"
type: blog
url: https://jina.ai/news/identifying-embedding-models-from-raw-numerical-values/
tags: [embeddings, neural-networks, security]
status: finished
date_added: 2026-03-01
---

jina built an 800K-parameter transformer classifier that identifies which embedding model produced a given vector by analyzing raw floating-point digits. 87% accuracy across 68 model-task combinations. tokenizes each number character-by-character, no feature engineering needed. absolute madlads — fingerprinting models from their output vectors alone.
