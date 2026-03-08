-- ============================================================
-- BLEV Platform - Supabase Schema + Seed
-- ============================================================

-- 1. PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  city text,
  state text,
  profile_type text not null check (profile_type in ('A', 'B', 'C')),
  coins int not null default 0,
  has_company boolean default false,
  has_partner boolean default false,
  capital_range text,
  notes text,
  created_at timestamptz not null default now(),
  is_admin boolean not null default false
);

-- 2. PHASES
create table public.phases (
  id serial primary key,
  profile_type text not null check (profile_type in ('A', 'B', 'C')),
  phase_number int not null,
  name text not null,
  description text,
  coins_reward int not null default 0,
  unique (profile_type, phase_number)
);

-- 3. ACTIONS
create table public.actions (
  id serial primary key,
  phase_id int not null references public.phases(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0
);

-- 4. USER_PROGRESS
create table public.user_progress (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  phase_id int not null references public.phases(id) on delete cascade,
  status text not null default 'locked' check (status in ('locked', 'active', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  unique (user_id, phase_id)
);

-- 5. USER_ACTIONS
create table public.user_actions (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action_id int not null references public.actions(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, action_id)
);

-- 6. BADGES
create table public.badges (
  id serial primary key,
  name text not null,
  description text,
  icon text,
  profile_type text not null check (profile_type in ('A', 'B', 'C', 'ALL'))
);

-- 7. USER_BADGES
create table public.user_badges (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id int not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- 8. STORE_ITEMS
create table public.store_items (
  id serial primary key,
  name text not null,
  description text,
  coins_price int not null,
  available boolean not null default true
);

-- 9. STORE_REQUESTS
create table public.store_requests (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id int not null references public.store_items(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_phases_profile_type on public.phases(profile_type);
create index idx_actions_phase_id on public.actions(phase_id);
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_actions_user_id on public.user_actions(user_id);
create index idx_user_badges_user_id on public.user_badges(user_id);
create index idx_store_requests_user_id on public.store_requests(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Allow insert on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- PHASES (public read)
alter table public.phases enable row level security;

create policy "Anyone can read phases"
  on public.phases for select
  using (true);

create policy "Only admins can manage phases"
  on public.phases for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ACTIONS (public read)
alter table public.actions enable row level security;

create policy "Anyone can read actions"
  on public.actions for select
  using (true);

create policy "Only admins can manage actions"
  on public.actions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- USER_PROGRESS
alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage all progress"
  on public.user_progress for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- USER_ACTIONS
alter table public.user_actions enable row level security;

create policy "Users can view own actions"
  on public.user_actions for select
  using (auth.uid() = user_id);

create policy "Users can update own actions"
  on public.user_actions for update
  using (auth.uid() = user_id);

create policy "Users can insert own actions"
  on public.user_actions for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage all user_actions"
  on public.user_actions for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- BADGES (public read)
alter table public.badges enable row level security;

create policy "Anyone can read badges"
  on public.badges for select
  using (true);

-- USER_BADGES
alter table public.user_badges enable row level security;

create policy "Users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "Admins can manage all badges"
  on public.user_badges for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- STORE_ITEMS (public read)
alter table public.store_items enable row level security;

create policy "Anyone can read store items"
  on public.store_items for select
  using (true);

-- STORE_REQUESTS
alter table public.store_requests enable row level security;

create policy "Users can view own requests"
  on public.store_requests for select
  using (auth.uid() = user_id);

create policy "Users can create own requests"
  on public.store_requests for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage all requests"
  on public.store_requests for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- SEED: PHASES + ACTIONS
-- ============================================================

-- ===================== CENÁRIO A (9 fases) =====================

insert into public.phases (profile_type, phase_number, name, description, coins_reward) values
('A', 1, 'Modelo de Negócio',          'Definir o modelo de negócio e entender a operação de recarga EV', 10),
('A', 2, 'Mapa de Calor da Região',    'Mapear a região para identificar oportunidades de instalação', 15),
('A', 3, 'Pesquisa de Campo',          'Validar dados do mapa de calor com visitas presenciais', 15),
('A', 4, 'Prospecção de Pontos',       'Identificar e negociar pontos comerciais para instalação', 20),
('A', 5, 'Validação e Score 75+',      'Validar viabilidade técnica e comercial com score mínimo de 75', 20),
('A', 6, 'Projeto e Orçamento Montado','Elaborar projeto técnico e orçamento completo da operação', 25),
('A', 7, 'Estruturação Legal',         'Constituir empresa, contratos e documentação jurídica', 20),
('A', 8, 'Execução e Instalação',      'Executar obra civil e instalar equipamentos de recarga', 30),
('A', 9, 'Go-Live Primeira Recarga',   'Iniciar operação com a primeira recarga oficial', 50);

-- Fase A1 - Modelo de Negócio
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=1), 'Assistir aula introdutória sobre o mercado de EV', 'Consumir o conteúdo base sobre o mercado de veículos elétricos e infraestrutura de recarga', 1),
((select id from public.phases where profile_type='A' and phase_number=1), 'Estudar os modelos de receita (recarga, mídia, conveniência)', 'Entender as diferentes fontes de receita de uma estação de recarga', 2),
((select id from public.phases where profile_type='A' and phase_number=1), 'Definir modelo de operação escolhido', 'Decidir se vai operar sozinho, com parceiro ou franquia', 3),
((select id from public.phases where profile_type='A' and phase_number=1), 'Preencher canvas do negócio BLEV', 'Completar o canvas simplificado com proposta de valor, público e canais', 4),
((select id from public.phases where profile_type='A' and phase_number=1), 'Validar entendimento com mentor/suporte', 'Agendar call ou enviar canvas para validação do time BLEV', 5);

-- Fase A2 - Mapa de Calor da Região
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=2), 'Definir raio de atuação (cidade/bairros)', 'Escolher a área geográfica onde pretende operar', 1),
((select id from public.phases where profile_type='A' and phase_number=2), 'Levantar dados de frota EV na região (Denatran/IBGE)', 'Pesquisar quantidade de veículos elétricos registrados na área', 2),
((select id from public.phases where profile_type='A' and phase_number=2), 'Mapear concorrentes e estações existentes', 'Identificar pontos de recarga já instalados na região', 3),
((select id from public.phases where profile_type='A' and phase_number=2), 'Identificar polos geradores de tráfego (shoppings, rodovias, hotéis)', 'Listar locais com alto fluxo de veículos e potencial de recarga', 4),
((select id from public.phases where profile_type='A' and phase_number=2), 'Montar mapa visual com pins das oportunidades', 'Criar mapa no Google Maps ou planilha com coordenadas dos pontos', 5);

-- Fase A3 - Pesquisa de Campo
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=3), 'Visitar pelo menos 5 pontos mapeados', 'Ir presencialmente aos locais identificados no mapa de calor', 1),
((select id from public.phases where profile_type='A' and phase_number=3), 'Fotografar e documentar cada local visitado', 'Registrar fotos da fachada, estacionamento e quadro elétrico', 2),
((select id from public.phases where profile_type='A' and phase_number=3), 'Conversar com responsáveis/gerentes dos locais', 'Fazer abordagem inicial para entender interesse do estabelecimento', 3),
((select id from public.phases where profile_type='A' and phase_number=3), 'Preencher ficha de avaliação de cada ponto', 'Usar formulário padrão BLEV para avaliar viabilidade do ponto', 4),
((select id from public.phases where profile_type='A' and phase_number=3), 'Classificar pontos por potencial (A/B/C)', 'Ranquear os pontos visitados por nível de oportunidade', 5);

-- Fase A4 - Prospecção de Pontos
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=4), 'Selecionar top 3 pontos para negociação', 'Escolher os melhores pontos da pesquisa de campo', 1),
((select id from public.phases where profile_type='A' and phase_number=4), 'Preparar apresentação comercial BLEV', 'Montar proposta de valor personalizada para o ponto', 2),
((select id from public.phases where profile_type='A' and phase_number=4), 'Realizar reunião presencial com decisor do ponto', 'Apresentar o projeto ao proprietário ou gestor do local', 3),
((select id from public.phases where profile_type='A' and phase_number=4), 'Negociar condições (cessão, aluguel, parceria)', 'Definir modelo comercial de uso do espaço', 4),
((select id from public.phases where profile_type='A' and phase_number=4), 'Obter carta de intenção ou pré-acordo assinado', 'Formalizar interesse mútuo por escrito', 5);

-- Fase A5 - Validação e Score 75+
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=5), 'Preencher formulário de score técnico do ponto', 'Usar a ferramenta BLEV para calcular score de viabilidade', 1),
((select id from public.phases where profile_type='A' and phase_number=5), 'Verificar viabilidade elétrica (potência disponível)', 'Confirmar se o ponto suporta a carga elétrica necessária', 2),
((select id from public.phases where profile_type='A' and phase_number=5), 'Avaliar fluxo estimado de veículos EV', 'Projetar demanda de recarga no local', 3),
((select id from public.phases where profile_type='A' and phase_number=5), 'Submeter score para validação BLEV', 'Enviar resultado do score para aprovação do time', 4),
((select id from public.phases where profile_type='A' and phase_number=5), 'Atingir score mínimo de 75 pontos', 'Garantir que o ponto atingiu o mínimo de viabilidade', 5);

-- Fase A6 - Projeto e Orçamento Montado
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=6), 'Definir tipo e quantidade de carregadores', 'Escolher modelos (AC/DC) e potência dos equipamentos', 1),
((select id from public.phases where profile_type='A' and phase_number=6), 'Solicitar orçamento de equipamentos', 'Pedir cotação dos carregadores e acessórios', 2),
((select id from public.phases where profile_type='A' and phase_number=6), 'Solicitar orçamento de obra civil e elétrica', 'Cotar instalação elétrica, piso, sinalização e acabamento', 3),
((select id from public.phases where profile_type='A' and phase_number=6), 'Montar planilha de investimento total', 'Consolidar todos os custos em uma planilha financeira', 4),
((select id from public.phases where profile_type='A' and phase_number=6), 'Calcular payback e projeção de faturamento', 'Estimar retorno do investimento e receita mensal', 5),
((select id from public.phases where profile_type='A' and phase_number=6), 'Validar orçamento com time BLEV', 'Submeter planilha para revisão e aprovação', 6);

-- Fase A7 - Estruturação Legal
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=7), 'Abrir CNPJ (se necessário)', 'Constituir empresa com CNAE adequado para operação de recarga', 1),
((select id from public.phases where profile_type='A' and phase_number=7), 'Definir regime tributário', 'Escolher Simples, Lucro Presumido ou MEI conforme orientação contábil', 2),
((select id from public.phases where profile_type='A' and phase_number=7), 'Elaborar contrato de cessão/locação do ponto', 'Redigir contrato com o proprietário do espaço', 3),
((select id from public.phases where profile_type='A' and phase_number=7), 'Providenciar alvará e licenças necessárias', 'Obter autorizações municipais para operação', 4),
((select id from public.phases where profile_type='A' and phase_number=7), 'Contratar seguro da operação', 'Fazer seguro de responsabilidade civil e equipamentos', 5);

-- Fase A8 - Execução e Instalação
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=8), 'Contratar equipe de obra civil', 'Selecionar prestador para adequação do espaço', 1),
((select id from public.phases where profile_type='A' and phase_number=8), 'Executar adequação elétrica do ponto', 'Realizar instalação do quadro, cabeamento e proteções', 2),
((select id from public.phases where profile_type='A' and phase_number=8), 'Instalar carregadores', 'Fixar e conectar os equipamentos de recarga', 3),
((select id from public.phases where profile_type='A' and phase_number=8), 'Instalar sinalização e identidade visual', 'Colocar placas, adesivos e demarcação de vagas', 4),
((select id from public.phases where profile_type='A' and phase_number=8), 'Realizar testes de funcionamento', 'Testar cada carregador com veículo real', 5),
((select id from public.phases where profile_type='A' and phase_number=8), 'Configurar sistema de gestão e pagamento', 'Ativar app/plataforma de cobrança e monitoramento', 6);

-- Fase A9 - Go-Live Primeira Recarga
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='A' and phase_number=9), 'Registrar estação na plataforma BLEV', 'Cadastrar o ponto no sistema oficial para visibilidade', 1),
((select id from public.phases where profile_type='A' and phase_number=9), 'Divulgar abertura nas redes sociais', 'Fazer posts e stories anunciando a inauguração', 2),
((select id from public.phases where profile_type='A' and phase_number=9), 'Realizar primeira recarga oficial', 'Executar a primeira recarga real com cliente ou demonstração', 3),
((select id from public.phases where profile_type='A' and phase_number=9), 'Enviar comprovante da primeira recarga para BLEV', 'Registrar evidência (print/foto) da recarga realizada', 4),
((select id from public.phases where profile_type='A' and phase_number=9), 'Celebrar e compartilhar conquista na comunidade', 'Postar na comunidade BLEV e receber badge de conclusão', 5);

-- ===================== CENÁRIO B (7 fases) =====================

insert into public.phases (profile_type, phase_number, name, description, coins_reward) values
('B', 1, 'Modelo de Negócio',            'Entender o modelo de negócio aplicado ao seu ponto existente', 10),
('B', 2, 'Score Técnico do Ponto',        'Avaliar a viabilidade técnica e comercial do ponto atual', 20),
('B', 3, 'Análise Técnica e Elétrica',    'Realizar levantamento detalhado da infraestrutura elétrica', 20),
('B', 4, 'Projeto e Orçamento Montado',   'Elaborar projeto completo e orçamento para o ponto', 25),
('B', 5, 'Estruturação Legal',            'Regularizar documentação jurídica e fiscal', 20),
('B', 6, 'Execução e Instalação',         'Instalar equipamentos e adequar o ponto de recarga', 30),
('B', 7, 'Go-Live Primeira Recarga',      'Inaugurar operação com a primeira recarga', 50);

-- Fase B1 - Modelo de Negócio
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=1), 'Assistir aula introdutória sobre o mercado de EV', 'Consumir o conteúdo base sobre veículos elétricos e recarga', 1),
((select id from public.phases where profile_type='B' and phase_number=1), 'Estudar os modelos de receita aplicáveis ao seu ponto', 'Entender como monetizar recarga no seu estabelecimento', 2),
((select id from public.phases where profile_type='B' and phase_number=1), 'Identificar perfil dos clientes do seu ponto', 'Mapear se seus clientes atuais possuem ou pretendem ter EV', 3),
((select id from public.phases where profile_type='B' and phase_number=1), 'Preencher canvas do negócio BLEV', 'Completar o canvas com foco no seu ponto existente', 4),
((select id from public.phases where profile_type='B' and phase_number=1), 'Validar entendimento com mentor/suporte', 'Agendar call para validação do plano', 5);

-- Fase B2 - Score Técnico do Ponto
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=2), 'Preencher formulário de score do ponto', 'Usar a ferramenta BLEV para avaliar seu ponto', 1),
((select id from public.phases where profile_type='B' and phase_number=2), 'Fotografar estacionamento e área de instalação', 'Documentar o espaço disponível com fotos detalhadas', 2),
((select id from public.phases where profile_type='B' and phase_number=2), 'Informar fluxo médio diário de veículos', 'Estimar quantos veículos passam pelo ponto por dia', 3),
((select id from public.phases where profile_type='B' and phase_number=2), 'Submeter score para análise BLEV', 'Enviar formulário preenchido para validação', 4),
((select id from public.phases where profile_type='B' and phase_number=2), 'Receber resultado e recomendações', 'Aguardar feedback com score e próximos passos', 5);

-- Fase B3 - Análise Técnica e Elétrica
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=3), 'Fotografar quadro elétrico geral', 'Registrar imagens do quadro de distribuição atual', 1),
((select id from public.phases where profile_type='B' and phase_number=3), 'Levantar potência disponível na instalação', 'Verificar com eletricista a capacidade elétrica do ponto', 2),
((select id from public.phases where profile_type='B' and phase_number=3), 'Verificar necessidade de aumento de carga', 'Avaliar se será preciso solicitar ampliação à concessionária', 3),
((select id from public.phases where profile_type='B' and phase_number=3), 'Mapear distância do quadro até o ponto de instalação', 'Medir metragem de cabeamento necessário', 4),
((select id from public.phases where profile_type='B' and phase_number=3), 'Enviar relatório técnico para BLEV', 'Consolidar dados e enviar para análise do time técnico', 5);

-- Fase B4 - Projeto e Orçamento Montado
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=4), 'Definir tipo e quantidade de carregadores', 'Escolher modelos adequados ao perfil do ponto', 1),
((select id from public.phases where profile_type='B' and phase_number=4), 'Solicitar orçamento de equipamentos', 'Pedir cotação dos carregadores e componentes', 2),
((select id from public.phases where profile_type='B' and phase_number=4), 'Solicitar orçamento de adequação elétrica', 'Cotar serviço de instalação elétrica', 3),
((select id from public.phases where profile_type='B' and phase_number=4), 'Montar planilha de investimento total', 'Consolidar custos de equipamento, obra e licenças', 4),
((select id from public.phases where profile_type='B' and phase_number=4), 'Validar orçamento com time BLEV', 'Enviar planilha para aprovação e ajustes', 5);

-- Fase B5 - Estruturação Legal
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=5), 'Verificar CNAE e enquadramento fiscal', 'Confirmar se o CNPJ permite atividade de recarga', 1),
((select id from public.phases where profile_type='B' and phase_number=5), 'Atualizar contrato social (se necessário)', 'Incluir atividade de recarga no objeto social', 2),
((select id from public.phases where profile_type='B' and phase_number=5), 'Providenciar alvará e licenças', 'Obter autorizações municipais necessárias', 3),
((select id from public.phases where profile_type='B' and phase_number=5), 'Contratar seguro da operação', 'Fazer seguro de responsabilidade civil e equipamentos', 4);

-- Fase B6 - Execução e Instalação
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=6), 'Executar adequação elétrica', 'Realizar instalação de quadro, cabeamento e proteções', 1),
((select id from public.phases where profile_type='B' and phase_number=6), 'Instalar carregadores', 'Fixar e conectar equipamentos de recarga', 2),
((select id from public.phases where profile_type='B' and phase_number=6), 'Instalar sinalização e identidade visual', 'Colocar placas, adesivos e demarcação de vagas EV', 3),
((select id from public.phases where profile_type='B' and phase_number=6), 'Realizar testes de funcionamento', 'Testar cada carregador com veículo real', 4),
((select id from public.phases where profile_type='B' and phase_number=6), 'Configurar sistema de gestão e pagamento', 'Ativar plataforma de cobrança e monitoramento', 5);

-- Fase B7 - Go-Live Primeira Recarga
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='B' and phase_number=7), 'Registrar estação na plataforma BLEV', 'Cadastrar o ponto no sistema oficial', 1),
((select id from public.phases where profile_type='B' and phase_number=7), 'Divulgar para clientes atuais do estabelecimento', 'Comunicar a novidade para sua base de clientes', 2),
((select id from public.phases where profile_type='B' and phase_number=7), 'Realizar primeira recarga oficial', 'Executar a primeira recarga real', 3),
((select id from public.phases where profile_type='B' and phase_number=7), 'Enviar comprovante da primeira recarga para BLEV', 'Registrar evidência da recarga realizada', 4),
((select id from public.phases where profile_type='B' and phase_number=7), 'Celebrar e compartilhar na comunidade BLEV', 'Postar conquista e receber badge de conclusão', 5);

-- ===================== PERFIL C (5 fases) =====================

insert into public.phases (profile_type, phase_number, name, description, coins_reward) values
('C', 1, 'Domínio do Método',           'Aprender o método BLEV de vendas e consultoria', 15),
('C', 2, 'Estruturação Comercial',       'Preparar materiais e processos comerciais', 20),
('C', 3, 'Reunião com Guilherme',        'Alinhar estratégia diretamente com Guilherme', 15),
('C', 4, 'Prospecção Ativa',             'Iniciar prospecção e abordagem de leads', 25),
('C', 5, 'Primeira Venda',              'Fechar a primeira venda e iniciar operação comercial', 50);

-- Fase C1 - Domínio do Método
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='C' and phase_number=1), 'Assistir treinamento completo do método BLEV', 'Consumir todos os módulos de capacitação comercial', 1),
((select id from public.phases where profile_type='C' and phase_number=1), 'Estudar o pitch de vendas padrão', 'Memorizar e praticar o roteiro de apresentação', 2),
((select id from public.phases where profile_type='C' and phase_number=1), 'Conhecer os 3 perfis de cliente (A, B e parceiros)', 'Entender as diferenças entre cada cenário de venda', 3),
((select id from public.phases where profile_type='C' and phase_number=1), 'Dominar objeções frequentes e respostas', 'Estudar as principais objeções e como contorná-las', 4),
((select id from public.phases where profile_type='C' and phase_number=1), 'Realizar simulação de venda com mentor', 'Fazer role-play de uma venda completa e receber feedback', 5);

-- Fase C2 - Estruturação Comercial
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='C' and phase_number=2), 'Criar perfil profissional (LinkedIn/Instagram)', 'Montar presença digital focada em mobilidade elétrica', 1),
((select id from public.phases where profile_type='C' and phase_number=2), 'Preparar materiais de apresentação', 'Ter deck, one-pager e proposta comercial prontos', 2),
((select id from public.phases where profile_type='C' and phase_number=2), 'Configurar CRM ou planilha de leads', 'Organizar ferramenta para gestão de contatos e pipeline', 3),
((select id from public.phases where profile_type='C' and phase_number=2), 'Definir meta de prospecção semanal', 'Estabelecer quantidade de abordagens por semana', 4),
((select id from public.phases where profile_type='C' and phase_number=2), 'Mapear rede de contatos e primeiros leads', 'Listar potenciais clientes da sua rede atual', 5);

-- Fase C3 - Reunião com Guilherme
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='C' and phase_number=3), 'Preparar resumo do que aprendeu até aqui', 'Consolidar aprendizados e dúvidas para a reunião', 1),
((select id from public.phases where profile_type='C' and phase_number=3), 'Agendar reunião com Guilherme', 'Marcar horário via calendário disponível', 2),
((select id from public.phases where profile_type='C' and phase_number=3), 'Participar da reunião e anotar direcionamentos', 'Estar presente e registrar orientações recebidas', 3),
((select id from public.phases where profile_type='C' and phase_number=3), 'Alinhar região e estratégia de atuação', 'Definir área geográfica e perfil de cliente foco', 4),
((select id from public.phases where profile_type='C' and phase_number=3), 'Confirmar metas e compromissos acordados', 'Formalizar combinados por escrito', 5);

-- Fase C4 - Prospecção Ativa
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='C' and phase_number=4), 'Realizar pelo menos 10 abordagens na primeira semana', 'Entrar em contato com no mínimo 10 potenciais clientes', 1),
((select id from public.phases where profile_type='C' and phase_number=4), 'Agendar pelo menos 3 reuniões de apresentação', 'Converter abordagens em reuniões presenciais ou online', 2),
((select id from public.phases where profile_type='C' and phase_number=4), 'Realizar as reuniões e registrar feedback', 'Apresentar a solução e documentar reações e objeções', 3),
((select id from public.phases where profile_type='C' and phase_number=4), 'Enviar propostas comerciais personalizadas', 'Elaborar e enviar proposta para leads qualificados', 4),
((select id from public.phases where profile_type='C' and phase_number=4), 'Atualizar pipeline e reportar ao time', 'Manter CRM atualizado e compartilhar status com BLEV', 5);

-- Fase C5 - Primeira Venda
insert into public.actions (phase_id, name, description, sort_order) values
((select id from public.phases where profile_type='C' and phase_number=5), 'Fazer follow-up dos leads em negociação', 'Acompanhar propostas enviadas e nutrir relacionamento', 1),
((select id from public.phases where profile_type='C' and phase_number=5), 'Negociar e fechar contrato', 'Conduzir negociação final e assinar contrato', 2),
((select id from public.phases where profile_type='C' and phase_number=5), 'Registrar venda no sistema BLEV', 'Cadastrar o cliente e a venda na plataforma', 3),
((select id from public.phases where profile_type='C' and phase_number=5), 'Enviar comprovante de venda para validação', 'Submeter contrato ou pedido assinado para o time', 4),
((select id from public.phases where profile_type='C' and phase_number=5), 'Celebrar e compartilhar na comunidade BLEV', 'Postar conquista e receber badge de primeira venda', 5);

-- ============================================================
-- SEED: BADGES
-- ============================================================

insert into public.badges (name, description, icon, profile_type) values
('Primeiro Passo',      'Completou a primeira fase da jornada',             '🚀', 'ALL'),
('Mapa Traçado',        'Concluiu o mapeamento da região',                  '🗺️', 'A'),
('Explorador de Campo', 'Realizou todas as visitas de pesquisa de campo',   '🔍', 'A'),
('Negociador',          'Obteve pré-acordo de ponto comercial',             '🤝', 'A'),
('Score 75+',           'Atingiu score mínimo de viabilidade',              '✅', 'A'),
('Projeto Aprovado',    'Teve projeto e orçamento validados',               '📐', 'A'),
('Empresa Aberta',      'Concluiu estruturação legal',                      '⚖️', 'A'),
('Instalação Completa', 'Finalizou execução e instalação',                  '🔧', 'A'),
('Go-Live!',            'Realizou a primeira recarga oficial',              '⚡', 'A'),
('Ponto Validado',      'Teve seu ponto aprovado com score técnico',        '📍', 'B'),
('Elétrica OK',         'Concluiu análise técnica e elétrica',              '🔌', 'B'),
('Projeto Montado',     'Finalizou projeto e orçamento',                    '📋', 'B'),
('Legalizado',          'Concluiu estruturação legal do ponto',             '📜', 'B'),
('Estação Ativa',       'Instalou e ativou a estação de recarga',           '🏗️', 'B'),
('Go-Live!',            'Realizou a primeira recarga no seu ponto',         '⚡', 'B'),
('Método Dominado',     'Completou treinamento do método BLEV',             '🎓', 'C'),
('Comercial Pronto',    'Estruturou toda a base comercial',                 '💼', 'C'),
('Alinhado com Líder',  'Fez reunião de alinhamento com Guilherme',         '🎯', 'C'),
('Prospector Ativo',    'Realizou ciclo completo de prospecção',            '📞', 'C'),
('Primeira Venda!',     'Fechou a primeira venda como parceiro BLEV',       '🏆', 'C'),
('Jornada Completa',    'Completou todas as fases do seu perfil',           '👑', 'ALL'),
('Colecionador',        'Conquistou 10 badges',                             '🎖️', 'ALL');

-- ============================================================
-- SEED: STORE ITEMS (exemplo)
-- ============================================================

insert into public.store_items (name, description, coins_price) values
('Camiseta BLEV',           'Camiseta oficial da comunidade BLEV',                   50),
('Mentoria Extra 30min',    'Sessão adicional de mentoria individual',               100),
('Desconto 10% Equipamento','Cupom de 10% na compra de carregadores parceiros',      150),
('Acesso Evento VIP',       'Ingresso para evento exclusivo da comunidade BLEV',     200),
('Kit Boas-vindas Premium', 'Kit com camiseta, adesivos, caneca e manual impresso',  300);
