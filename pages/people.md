---
layout: single
permalink: /people/
title: People
# toc: true
---


{% for person in site.people %}
<div class="person">
  <div class="person-photo">
    <!-- <a href="{{person.url}}"> -->
      <img src="{{person.image}}" alt="{{person.name}} image" width="300"/>
    <!-- </a> -->
  </div>
  <div class="name">
    {{ person.name }}
  </div>
  <div class="blerb">
    <p>{{ person.content | markdownify }}</p>
  </div>
  <!-- <div class="person-links">
    <a href="/download/{{ pub.slug}}.pdf"><i class="far fa-file-pdf"></i> PDF</a>&nbsp;&nbsp;
    <a href="{{person.url}}"><i class="fas fa-arrow-right"></i> Project Page</a>
  </div> -->
</div>
{% endfor %}

  <!-- <p>{{ person.content | markdownify }}</p> -->
