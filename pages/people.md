---
layout: single
permalink: /people/
title: People
---
<style>
  .person {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 2rem;
    gap: 1rem;
  }
  .person-photo {
    flex: 0 0 300px;
  }
  .person-photo img {
    max-width: 100%;
    height: auto;
  }
  .person-info {
    flex: 1 1 300px;
  }
  .name {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  @media (max-width: 768px) {
    .person {
      flex-direction: column;
    }
    .person-photo {
      flex: 0 0 100%;
    }
    .person-info {
      flex: 1 1 100%;
    }
  }
</style>

# Current Members
{% assign sorted_people = site.people | where: "current", true | sort: "order" %}
{% for person in sorted_people %}
<div class="person">
  <div class="person-photo">
    <img src="{{person.image}}" alt="{{person.name}} image" />
  </div>
  <div class="person-info">
    <div class="name">
      {{ person.name }}
    </div>
    <div class="blerb">
      {{ person.content | markdownify }}
    </div>
  </div>
</div>
{% endfor %}

# Past members
{% assign sorted_people = site.people | where: "current", false | sort: "order" %}
{% for person in sorted_people %}
<div class="person">
  <div class="person-photo">
    <img src="{{person.image}}" alt="{{person.name}} image" />
  </div>
  <div class="person-info">
    <div class="name">
      {{ person.name }}
    </div>
    <div class="blerb">
      {{ person.content | markdownify }}
    </div>
  </div>
</div>
{% endfor %}
