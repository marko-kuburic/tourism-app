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

create table if not exists key_points (
  id           binary(16) primary key,
  tour_id      binary(16) not null,
  name         varchar(120) not null,
  description  varchar(2048) not null,
  lat          double not null,
  lng          double not null,
  image_url    varchar(1024),
  seq          int not null,
  created_at   timestamp not null,
  updated_at   timestamp not null,
  index idx_key_points_tour (tour_id),
  index idx_key_points_tour_seq (tour_id, seq),
  constraint fk_key_points_tour foreign key (tour_id) references tours(id) on delete cascade
);

create table if not exists sim_locations (
  id         binary(16) primary key,
  user_id    binary(16) not null,
  lat        double not null,
  lng        double not null,
  created_at timestamp not null,
  updated_at timestamp not null,
  unique key uq_sim_locations_user (user_id)
);
