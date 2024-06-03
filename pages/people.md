---
layout: single
permalink: /people/
title: People
# toc: true
---
{% assign sorted_people = site.people | sort: "order" %}
{% for person in sorted_people %}
<div class="person">
  <div class="person-photo">
    <!-- <a href="{{person.url}}"> -->
      <img src="{{person.image}}" alt="{{person.name}} image" width="300"/>
    <!-- </a> -->
  </div>
  <div class="name">
    {{ person.name }}
  </div>
  <div class="blerb" style="margin-left: 350px;">
    <p>{{ person.content | markdownify }}</p>
  </div>
  <!-- <div class="person-links">
    <a href="/download/{{ pub.slug}}.pdf"><i class="far fa-file-pdf"></i> PDF</a>&nbsp;&nbsp;
    <a href="{{person.url}}"><i class="fas fa-arrow-right"></i> Project Page</a>
  </div> -->
</div>
{% endfor %}

  <!-- <p>{{ person.content | markdownify }}</p> -->
