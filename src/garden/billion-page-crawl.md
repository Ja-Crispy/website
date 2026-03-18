---
title: "crawling a billion web pages in 24 hours"
type: blog
url: https://andrewkchan.dev/posts/crawler.html
tags: [infrastructure, performance, web]
status: finished
date_added: 2026-01-25
---

andrew chan crawled 1B+ web pages in ~25.5 hours using 12 AWS instances for $462. reveals that HTML parsing is now a major bottleneck due to larger pages, and SSL computation dominates CPU in fetching. great look at how crawling infrastructure has evolved since 2012.
