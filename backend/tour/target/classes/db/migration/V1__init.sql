create table if not exists tours (
  id binary(16) primary key,
  author_id binary(16) not null,
  name varchar(255) not null,
  description text not null,
  difficulty varchar(32) not null,
  status varchar(32) not null,
  price_cents bigint not null,
  created_at timestamp not null,
  updated_at timestamp not null
);

create table if not exists tour_tags (
  tour_id binary(16) not null,
  tag varchar(64) not null,
  primary key (tour_id, tag),
  constraint fk_tour_tags_tour
    foreign key (tour_id) references tours(id) on delete cascade
);
